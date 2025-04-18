import { Request, Response, NextFunction } from 'express';
import { SteamService } from '../services/steam.service.js';

export async function validateSteam(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { steamid, gameKey } = req.body as { steamid: string; gameKey: 'Civ6' | 'Civ7' };
  const err = await SteamService.validate(steamid, gameKey);
  if (err) {
    res.status(400).json({ error: err });
    return;
  }
  next();
}

export async function checkOwnership(
  req: Request,
  res: Response
): Promise<void> {
  const { steamid, gameKey } = req.body as { steamid: string; gameKey: 'Civ6' | 'Civ7' };
  const result = await SteamService.checkGamesAddRole(steamid, gameKey);
  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: result.success });
}
