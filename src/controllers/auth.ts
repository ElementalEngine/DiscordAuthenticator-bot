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
    if (!req.query.code) {
      return res.json({ error: 'No code provided' });
    }

    if (!req.query.state) {
      return res.json({
        error: 'Please request a new link using /register - this link does not contain your Discord UserID',
      });
    }

    const [gameLower, userId] = decodeURI(req.query.state).split('|');
    const game = config.steam[gameLower === 'civ6' ? 'gameIdCiv6' : 'gameIdCiv7'];
    if (!gameLower) {
      return res.json({ error: 'No game provided' });
    }

    // 🔹 Get Discord access token
    const { access_token, error } = await DiscordController.getAccessToken(req.query.code);
    if (error) return res.json({ error });

    // 🔹 Get Discord profile
    const { profile, error: profileError } = await DiscordController.getProfile(access_token);
    if (profileError) return res.json({ error: profileError });

    if (!profile || profile.id !== userId) {
      return res.json({
        error: 'You are logged into different Discord accounts on the website and in the app. Log out and try again.',
      });
    }
    req.discord = profile;

    // 🔹 Check if user is already registered
    const existingPlayer = await Player.findOne({
      $or: [{ discord_id: profile.id }, { steam_id: profile.id }],
    });

    if (existingPlayer) {
      return res.json({ error: 'You are already registered!' });
    }

    // 🔹 Get Discord connections (to verify Steam link)
    const { connections, error: connectionsError } = await DiscordController.getConnections(access_token);
    if (connectionsError) return res.json({ error: connectionsError });

    const steam = connections.find(({ type }: any) => type === 'steam');
    if (!steam) {
      return res.json({
        error: 'Your Steam account is not linked to Discord. Please follow the instructions again.',
      });
    }

    // 🔹 Validate Steam account
    const { error: steamError } = await SteamController.validate(steam.id, game);
    if (steamError) return res.json({ error: steamError });

    req.steamid = steam.id;
    next();
  },

  registerUser: async (req: any, res: Response) => {
    const [gameLower] = decodeURI(req.query.state).split('|');
    const discord = client as Client;
    const guild = discord.guilds.cache.first();
    const member = await guild?.members.fetch(req.discord.id);

    if (!member) return res.json({ error: 'Could not find member' });

    // 🔹 Assign Civ6 or Civ7 rank role
    const roleId = gameLower === 'civ6' ? config.discord.roles.Civ6Rank : config.discord.roles.Civ7Rank;
    const role = guild?.roles.cache.get(roleId);
    const nonVerifiedRole = guild?.roles.cache.get(process.env.ROLE_NON_VERIFIED!);

    if (role) {
      console.log(`Assigning role ${role.id} to ${req.discord.username}`);
      await member.roles.add(role).catch(console.error);
    } else {
      console.error('Role not found!');
    }

    // 🔹 Remove non-verified role if registration is complete
    if (nonVerifiedRole) {
      console.log(`Removing non-verified role from ${req.discord.username}`);
      await member.roles.remove(nonVerifiedRole).catch(console.error);
    } else {
      console.error('Non-verified role not found!');
    }

    // 🔹 Log successful registration
    await AuthLogs.logRegistration(req.discord, req.steamid);
    await AuthLogs.logAuth(req.discord); // 🔹 Moved here (only logs successful registrations)

    // 🔹 Save to database
    const newPlayer = {
      discord_id: req.discord.id,
      steam_id: req.steamid,
      display_name: req.discord.global_name,
      user_name: req.discord.username,
    };

    await Player.create(newPlayer)
      .then(() => res.json({ success: 'Registered' }))
      .catch((error) => {
        console.error('Error creating player', error);
        res.json({ error: 'Error creating player' });
      });
  },
};
