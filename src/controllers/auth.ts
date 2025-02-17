import { Client } from 'discord.js';
import { NextFunction, Response } from 'express';
import { config } from '../config';
import client from '../discord';
import { DiscordController } from './discord';
import { SteamController } from './steam';
import { findPlayerByDiscordId, findPlayerBySteamId, createPlayer } from '../database/queries';
import { AuthLogs } from './authLogs';

export const AuthController = {
  // Authenticate user using Discord OAuth and linked Steam account.
  authenticate: async (req: any, res: Response, next: NextFunction) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).json({ error: 'No authorization code provided.' });
      if (!state) {
        return res.status(400).json({ error: 'Invalid authentication link. Please request a new one using /register.' });
      }

      // Decode and split the state. Expected format: "accountType|gameLower|discordUserId"
      const decodedState = decodeURIComponent(state as string);
      const parts = decodedState.split('|');
      if (parts.length < 3) {
        return res.status(400).json({ error: 'Invalid authentication state format.' });
      }

      const [accountType, gameLower, userId] = parts;
      // Ensure the game is one of the supported ones.
      const formattedGame = gameLower.charAt(0).toUpperCase() + gameLower.slice(1).toLowerCase();
      if (formattedGame !== 'Civ6' && formattedGame !== 'Civ7') {
        return res.status(400).json({ error: 'Invalid game provided.' });
      }

      // Retrieve game settings from config.
      const steamConfig = config.steam;
      const gameId = Number(steamConfig[`gameId${formattedGame}`]);
      const requiredPlayTime = Number(steamConfig[`playTime${formattedGame}`]);
      if (!gameId || !requiredPlayTime) {
        return res.status(400).json({ error: 'Invalid game configuration.' });
      }
      console.log(`[INFO] Authenticating Discord user ${userId} for ${formattedGame} (AppID: ${gameId}, Required Playtime: ${requiredPlayTime} minutes)`);

      // Exchange the code for an access token.
      const { access_token, error: tokenError } = await DiscordController.getAccessToken(code);
      if (tokenError) {
        return res.status(401).json({ error: 'Failed to obtain Discord access token.' });
      }
      // Fetch the Discord profile.
      const { profile, error: profileError } = await DiscordController.getProfile(access_token!);
      if (profileError || !profile || profile.id !== userId) {
        return res.status(403).json({ error: 'Discord account mismatch. Log out and try again.' });
      }
      req.discord = profile;

      // Check if user is already registered.
      const existingPlayer =
        (await findPlayerByDiscordId(profile.id)) || (await findPlayerBySteamId(profile.id));
      if (existingPlayer) {
        return res.status(409).json({
          error: 'You are already registered!',
          discord_id: existingPlayer.discord_id,
          steam_id: existingPlayer.steam_id || 'No Steam ID linked',
        });
      }

      // Fetch connected accounts from Discord.
      const { connections, error: connectionsError } = await DiscordController.getConnections(access_token!);
      if (connectionsError) {
        return res.status(500).json({ error: 'Failed to fetch Discord connections.' });
      }

      // Only support "steam" account type for now.
      if (accountType === 'steam') {
        const steamConnection = connections.find((c: any) => c.type === 'steam');
        if (!steamConnection) {
          return res.status(400).json({
            error: 'Your Steam account is not linked to Discord. Please follow the instructions again.',
          });
        }
        // Validate Steam ownership and playtime.
        const steamValidationError = await SteamController.validate(steamConnection.id, formattedGame as 'Civ6' | 'Civ7');
        if (steamValidationError) {
          return res.status(403).json({ error: steamValidationError });
        }
        req.steamid = steamConnection.id;
      } else {
        return res.status(400).json({ error: 'Invalid account type provided.' });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ error: 'Internal server error during authentication.' });
    }
  },

  // Register the user: assign roles, log events, create DB record, and send DM confirmation.
  registerUser: async (req: any, res: Response) => {
    try {
      const stateStr = req.query.state as string;
      const parts = decodeURIComponent(stateStr).split('|');
      if (parts.length < 3) return res.status(400).json({ error: 'Invalid registration state.' });
  
      // Use the second part for gameLower (not the first)
      const gameLower = parts[1];
      const formattedGame = gameLower.charAt(0).toUpperCase() + gameLower.slice(1).toLowerCase();
      if (formattedGame !== 'Civ6' && formattedGame !== 'Civ7')
        return res.status(400).json({ error: 'Invalid game provided in state.' });
  
      const discordClient = client as Client;
      const guild = discordClient.guilds.cache.get(config.discord.guildId);
      if (!guild) return res.status(500).json({ error: 'Discord server not found.' });
  
      // Fetch the Discord member using the attached profile
      const member = await guild.members.fetch(req.discord.id);
      if (!member) return res.status(404).json({ error: 'Discord member not found in the server.' });
  
      // Refresh roles and determine the game role to assign
      await guild.roles.fetch();
      const roleKey = `${formattedGame}Rank`;
      const roleId = (config.discord.roles as Record<string, string>)[roleKey];
      if (!roleId)
        return res.status(500).json({ error: 'Role configuration error. Contact an administrator.' });
  
      const gameRole = guild.roles.cache.get(roleId);
      if (!gameRole)
        return res.status(500).json({ error: 'Game role not found. Contact an administrator.' });
  
      // Assign the game role to the member
      await member.roles.add(gameRole);
      console.log(`Added role ${gameRole.name} to ${member.user.username}.`);
  
      // If registering for Civ6, assign the additional novice role.
      if (formattedGame === 'Civ6') {
        const noviceRoleId = config.discord.roles.novice; // Make sure this is defined in your config
        if (noviceRoleId) {
          const noviceRole = guild.roles.cache.get(noviceRoleId);
          if (noviceRole) {
            await member.roles.add(noviceRole);
            console.log(`Added novice role (${noviceRole.name}) to ${member.user.username}.`);
          } else {
            console.error('Novice role not found in guild.');
          }
        }
      }
  
      // Remove non-verified role if present
      const nonVerifiedRole = guild.roles.cache.get(config.discord.roles.non_verified);
      if (nonVerifiedRole && member.roles.cache.has(nonVerifiedRole.id)) {
        await member.roles.remove(nonVerifiedRole);
        console.log(`Removed non-verified role from ${member.user.username}.`);
      }
  
      // Log registration and authentication events
      await AuthLogs.logRegistration(req.discord, 'Steam', req.steamid);
      await AuthLogs.logAuth(req.discord);
  
      // Create a new player record in the database
      await createPlayer(
        req.discord.id,
        req.steamid,
        req.discord.username,
        req.discord.global_name || req.discord.username
      );
      console.log(`User ${req.discord.username} registered in DB successfully.`);
  
      // Attempt to send a DM confirmation (ignore if DMs are disabled)
      try {
        await member.send(
          `${member}, you are now registered!\n📌 Server Map: <#${config.discord.channels.channel_list}>\n❓ FAQ: <#${config.discord.channels.faq}>\nℹ️ Info Hub: <#${config.discord.channels.info_hub}>`
        );
        console.log(`DM sent to ${member.user.tag}.`);
      } catch {
        console.log(`Could not send DM to ${member.user.tag}.`);
      }
  
      return res.status(201).json({ success: 'Registered successfully!' });
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ error: 'An error occurred while registering the user.' });
    }
  },
};
