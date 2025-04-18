import SteamAPI from 'steamapi';
import { config } from '../config/index.js';

const steamClient = new SteamAPI(config.steam.apiKey);

export class SteamService {
  static async validate(steamid: string, gameKey: 'Civ6' | 'Civ7'): Promise<string> {
    const appId = Number(config.steam[`gameId${gameKey}`]);
    const required = Number(config.steam[`playTime${gameKey}`]);
    if (!appId || !required) return '❌ Invalid game selection.';
    try {
      const owned = await steamClient.getUserOwnedGames(steamid);
      if (!Array.isArray(owned) || owned.length === 0) {
        return '⚠️ No games found or Steam profile private.';
      }
      const entry = owned.find(u => u.game.id === appId);
      if (!entry) {
        return '❌ You do not own this game, or your profile is private.';
      }
      return entry.minutes < required
        ? `❌ Insufficient playtime: ${entry.minutes}m (Required: ${required}m).`
        : '';
    } catch (err: any) {
      return '⚠️ Error during Steam validation.';
    }
  }

  static async checkGamesAddRole(steamid: string, gameKey: 'Civ6' | 'Civ7'): Promise<{ success?: string; error?: string }> {
    if (!/^\d+$/.test(steamid)) {
      return { error: '❌ Invalid Steam ID.' };
    }
    try {
      const appId = Number(config.steam[`gameId${gameKey}`]);
      const owned = await steamClient.getUserOwnedGames(steamid);
      const owns = Array.isArray(owned) && owned.some(u => u.game.id === appId);
      return owns
        ? { success: `✅ You own **${gameKey}**.` }
        : { error: `❌ You do not own **${gameKey}**.` };
    } catch (err: any) {
      return { error: '⚠️ Error verifying Steam ownership.' };
    }
  }
}
