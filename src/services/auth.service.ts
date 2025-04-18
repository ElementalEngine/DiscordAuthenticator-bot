import { config } from '../config/index.js';
import { DiscordService } from './discord.service.js';
import { SteamService } from './steam.service.js';
import {
  findPlayerByDiscordId,
  findPlayerBySteamId,
  createPlayer
} from '../database/queries.js';
import { AuthLogsService } from './auth-logs.service.js';
import type { DiscordProfile } from '../util/types.js';

export class AuthService {
  /** 
   * Exchange OAuth code for Discord profile,
   * validate Steam ownership/playtime, 
   * and ensure neither is already registered.
   */
  async authenticate(
    code: string,
    state: string
  ): Promise<{ discordProfile: DiscordProfile; steamId: string }> {
    // 1. Get Discord access token & profile
    const tokenRes = await DiscordService.getAccessToken(code);
    if (tokenRes.error) throw new Error(tokenRes.error);

    const profileRes = await DiscordService.getProfile(tokenRes.access_token!);
    if (profileRes.error) throw new Error(profileRes.error);
    const profile = profileRes.profile!;

    // 2. Prevent double-registration via Discord ID
    if (await findPlayerByDiscordId(profile.id)) {
      throw new Error('You are already registered.');
    }

    // 3. Fetch linked accounts from Discord
    const connRes = await DiscordService.getConnections(tokenRes.access_token!);
    if (connRes.error) throw new Error(connRes.error);

    // 4. Extract Steam connection
    const steamConn = connRes.connections.find((c: any) => c.type === 'steam');
    if (!steamConn) {
      throw new Error('Steam connection not found on Discord account.');
    }
    const steamId = steamConn.id;

    // 5. Decode and validate state
    const [accountType, gameLower, userId] = decodeURIComponent(state).split('|');
    if (accountType !== 'steam' || profile.id !== userId) {
      throw new Error('Invalid authentication state.');
    }

    // 6. Normalize game key for SteamConfig lookups
    const formattedGame = gameLower.charAt(0).toUpperCase() + gameLower.slice(1).toLowerCase();

    // 7. Validate ownership & playtime via Steam API
    const playErr = await SteamService.validate(
      steamId,
      formattedGame as 'Civ6' | 'Civ7'
    );
    if (playErr) throw new Error(playErr);

    // 8. Prevent double-registration via Steam ID
    if (await findPlayerBySteamId(steamId)) {
      throw new Error('Steam account already registered.');
    }

    // 9. Return both Discord profile and Steam ID for downstream use
    return { discordProfile: profile, steamId };
  }

  /**
   * After authenticate(), assign roles, log events, and persist to DB.
   */
  async registerUser(discord: DiscordProfile, steamId: string): Promise<void> {
    await AuthLogsService.logRegistration(discord, 'Steam', steamId);
    await AuthLogsService.logAuth(discord);
    await createPlayer(
      discord.id,
      steamId,
      discord.username,
      discord.global_name || discord.username
    );
  }
}
