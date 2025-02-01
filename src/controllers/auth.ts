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
      res.json({ error: 'No code provided' });
      return;
    }

    if (!req.query.state) {
      res.json({
        error:
          'Please request a new link from Discord by using /register - this link does not contain your Discord UserID',
      });
      return;
    }

    const [gameLower, userId] = decodeURI(req.query.state).split('|');
    const game = config.steam[gameLower === 'civ6' ? 'gameId' : 'gameIdCiv7']
    if (!gameLower) {
      res.json({ error: 'No game provided' });
      return;
    }

    const { access_token, error } = await DiscordController.getAccessToken(req.query.code);
    if (error) {
      res.json({ error });
      return;
    }

    const { profile, error: profileError } = await DiscordController.getProfile(access_token);
    if (profileError) {
      res.json({ error: profileError });
      return;
    }
    if (!profile || profile.id !== userId) {
      res.json({
        error:
          'You are logged into two different Discord accounts - one on the website and one in your app. Log out of the website and try again or try again from the website.',
      });
      return;
    }
    req.discord = profile;

    // 🔹 Log authentication attempt
    await AuthLogs.logAuth(profile);

    const { connections, error: connectionsError } = await DiscordController.getConnections(access_token);
    if (connectionsError) {
      res.json({ error: connectionsError });
      return;
    }

    const steam = connections.find(({ type }: any) => type === 'steam');
    if (!steam) {
      res.json({
        error:
          'Your Steam account does not seem to be linked to Discord. Please close this window and step through the instructions again.',
      });
      return;
    }

    const { error: steamError } = await SteamController.validate(steam.id, game);
    if (steamError) {
      res.json({ error: steamError });
      return;
    }
    req.steamid = steam.id;
    next();
  },

  registerUser: async (req: any, res: Response) => {
    const [gameLower, userId] = decodeURI(req.query.state).split('|');

    const discord = client as Client;
    const guild = discord.guilds.cache.first();
    const member = await guild?.members.fetch(req.discord.id);
    if (!member) {
      res.json({ error: 'Could not find member' });
      return;
    }

    const { error: foundError } = await SteamController.checkSteamIdExists(req.steamid);
    if (foundError) {
      await member.send({ content: `${foundError}` });
      res.json({ error: foundError });
      return;
    }

    const role = guild?.roles.cache.find(({ id }) => id === config.discord.roles.member);
    role && member.roles.add(role);

    const welcomeChannel = await guild?.channels.cache.get(config.discord.channels.welcome);
    if (welcomeChannel?.isTextBased()) {
      await welcomeChannel.send({
        content: `<@${req.discord.id}>, you are now registered.\nPlease read <#${config.discord.channels.rules}> and <#${config.discord.channels.about_us}>.`,
      });
    }

    // 🔹 Log successful registration
    await AuthLogs.logRegistration(req.discord, req.steamid);

    const newPlayer = {
      discord_id: req.discord.id,
      steam_id: req.steamid,
      display_name: req.discord.global_name,
      user_name: req.discord.username,
    }

    //  Add to database
    await Player.create(newPlayer).catch((error) => {
      console.error('Error creating player', error);
      res.json({ error: 'Error creating player' });
      return;
    });

    res.json({ success: 'Registered' });
  },
};