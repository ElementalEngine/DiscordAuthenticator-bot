import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import client from '../discord/client.js';
import { config } from '../config/index.js';

const authService = new AuthService();

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code) {
    res.status(400).json({ error: 'No authorization code provided.' });
    return;
  }
  if (!state) {
    res.status(400).json({ error: 'Invalid authentication state.' });
    return;
  }

  try {
    const { discordProfile, steamId } = await authService.authenticate(code, state);
    ;(req as any).discord = discordProfile;
    ;(req as any).steamid = steamId;
    next();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
    return;
  }
}

export async function registerUser(
  req: Request,
  res: Response
): Promise<void> {
  const discordProfile = (req as any).discord;
  const steamId        = (req as any).steamid;

  try {
    // pull game out of state and normalize
    const [, gameLower] = decodeURIComponent(req.query.state as string).split('|');
    const formattedGame = gameLower[0].toUpperCase() + gameLower.slice(1).toLowerCase();

    const guild  = client.guilds.cache.get(config.discord.guildId);
    if (!guild) {
      res.status(500).json({ error: 'Discord server not found.' });
      return;
    }
    const member = await guild.members.fetch(discordProfile.id);

    await guild.roles.fetch();

    // assign ranked role
    const gameRoleId = (config.discord.roles as Record<string,string>)[`${formattedGame}Rank`];
    if (!gameRoleId) {
      res.status(500).json({ error: `Role for ${formattedGame}Rank not configured.` });
      return;
    }
    await member.roles.add(gameRoleId);

    // if Civ6, also add novice
    if (formattedGame === 'Civ6' && config.discord.roles.novice) {
      await member.roles.add(config.discord.roles.novice);
    }

    // remove non-verified
    if (member.roles.cache.has(config.discord.roles.non_verified)) {
      await member.roles.remove(config.discord.roles.non_verified);
    }

    // log + persist
    await authService.registerUser(discordProfile, steamId);
    res.status(201).json({ success: 'Registered successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
    return;
  }
}
