import { Request, Response } from 'express';
import { DiscordService } from '../services/discord.service.js';

export async function getAccessToken(
  req: Request,
  res: Response
): Promise<void> {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ error: 'No code provided.' });
    return;
  }
  const result = await DiscordService.getAccessToken(code);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ access_token: result.access_token });
}

export async function getProfile(
  req: Request,
  res: Response
): Promise<void> {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({ error: 'No token provided.' });
    return;
  }
  const result = await DiscordService.getProfile(token);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result.profile);
}

export async function getConnections(
  req: Request,
  res: Response
): Promise<void> {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({ error: 'No token provided.' });
    return;
  }
  const result = await DiscordService.getConnections(token);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result.connections);
}
