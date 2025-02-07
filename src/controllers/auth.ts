import { Client } from 'discord.js';
import { NextFunction, Response } from 'express';
import { config } from '../config';
import client from '../discord';
import { DiscordController } from './discord';
import { SteamController } from './steam';
import { Player } from '../database/players';
import { AuthLogs } from './authLogs';

export const AuthController = {
  authenticate: async (req: any, res: Response, next: NextFunction) => {
    const { code, state } = req.query;
    if (!code) return res.json({ error: 'No code provided' });
    if (!state) return res.json({ error: 'Invalid link. Please request a new one using /register' });

    const [gameLower, userId] = decodeURI(state).split('|');
    const game = config.steam[gameLower === 'civ6' ? 'gameIdCiv6' : 'gameIdCiv7'];
    if (!gameLower) return res.json({ error: 'No game provided' });

    const { access_token, error } = await DiscordController.getAccessToken(code);
    if (error) return res.json({ error });

    const { profile, error: profileError } = await DiscordController.getProfile(access_token);
    if (profileError || !profile || profile.id !== userId) {
      return res.json({ error: 'Mismatch in Discord accounts. Log out and try again.' });
    }

    req.discord = profile;

    const existingPlayer = await Player.findOne({ 
      $or: [{ discord_id: profile.id }, { steam_id: profile.id }] 
    });

    if (existingPlayer) {
      return res.json({ 
        error: 'You are already registered!',
        discord_id: existingPlayer.discord_id,
        steam_id: existingPlayer.steam_id || 'No Steam ID linked',
      });
    }

    const { connections, error: connectionsError } = await DiscordController.getConnections(access_token);
    if (connectionsError) return res.json({ error: connectionsError });

    const steam = connections.find(({ type }: any) => type === 'steam');
    if (!steam) return res.json({ error: 'Your Steam account is not linked to Discord. Please follow the instructions again.' });

    const { error: steamError } = await SteamController.validate(steam.id, game);
    if (steamError) return res.json({ error: steamError });

    req.steamid = steam.id;
    next();
  },

  registerUser: async (req: any, res: Response) => {
    const [gameLower] = decodeURI(req.query.state).split('|');
    const discord = client as Client;
    const guild = discord.guilds.cache.get(config.discord.guildId);
    if (!guild) return res.json({ error: 'Guild not found!' });

    try {
      const member = await guild.members.fetch(req.discord.id);
      if (!member) return res.json({ error: 'Could not find member' });

      await guild.roles.fetch();
      const roleId = gameLower === 'civ6' ? config.discord.roles.Civ6Rank : config.discord.roles.Civ7Rank;
      const role = guild.roles.cache.get(roleId);
      const nonVerifiedRole = guild.roles.cache.get(config.discord.roles.non_verified);

      if (!role) return res.json({ error: `Game role not found. Contact an admin.` });

      await member.roles.add(role);
      if (nonVerifiedRole && member.roles.cache.has(nonVerifiedRole.id)) {
        await member.roles.remove(nonVerifiedRole);
      }

      await AuthLogs.logRegistration(req.discord, req.steamid);
      await AuthLogs.logAuth(req.discord);

      await Player.create({
        discord_id: req.discord.id,
        steam_id: req.steamid,
        display_name: req.discord.global_name,
        user_name: req.discord.username,
      });

      console.log(`✅ User ${req.discord.username} registered successfully!`);

      // Send welcome message via DM (ignore if DMs are disabled)
      try {
        await member.send(
          `${member}, you are now registered!\n📌 Server Map: <#${process.env.CHANNEL_LIST}>\n❓ FAQ: <#${process.env.CHANNEL_FAQ}>\nℹ️ Info Hub: <#${process.env.CHANNEL_INFORMATION_HUB}>`
        );
      } catch {
        console.log(`⚠️ Could not send DM to ${member.user.tag}, possibly disabled.`);
      }

      res.json({ success: 'Registered' });
    } catch (error) {
      console.error('❌ Error registering user:', error);
      res.json({ error: 'An error occurred while registering the user' });
    }
  },
};