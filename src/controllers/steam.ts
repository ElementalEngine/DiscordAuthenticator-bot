import SteamAPI from 'steamapi';
import { config } from '../config';

const steamClient = new SteamAPI(config.steam.apiKey);

export const SteamController = {
  // Validate that the user owns the game and meets the required playtime.
  validate: async (steamid: string, gameKey: 'Civ6' | 'Civ7'): Promise<string> => {
    try {
      const appId = Number(config.steam[`gameId${gameKey}`]);
      const requiredPlayTime = Number(config.steam[`playTime${gameKey}`]);
      if (!appId || !requiredPlayTime) {
        return '❌ Invalid game selection.';
      }

      console.log(`[INFO] Validating SteamID: ${steamid} for ${gameKey} (AppID: ${appId})`);

      const ownedGames = await steamClient.getUserOwnedGames(steamid);
      // Make sure we got a proper array back
      if (!Array.isArray(ownedGames) || ownedGames.length === 0) {
        console.error('[ERROR] Invalid response from Steam API:', ownedGames);
        return '⚠️ No games found or failed to retrieve games from Steam or profile set to private.';
      }

      // Find the entry for our game
      const entry = ownedGames.find((u) => u.game.id === appId);
      if (!entry) {
        return '❌ You do not own this game, or your profile is set to private.';
      }

      console.log(`[INFO] Playtime for ${gameKey}: ${entry.minutes} minutes`);

      if (entry.minutes < requiredPlayTime) {
        return `❌ Insufficient playtime: ${entry.minutes} minutes (Required: ${requiredPlayTime} minutes).`;
      }

      // Success
      return '';
    } catch (err) {
      console.error('[ERROR] Steam validation failed:', err);
      return '⚠️ An error occurred during Steam validation.';
    }
  },

  // Verify game ownership for role assignment.
  checkGamesAddRole: async (
    steamid: string,
    gameKey: 'Civ6' | 'Civ7'
  ): Promise<{ success?: string; error?: string }> => {
    if (!/^\d+$/.test(steamid)) {
      return { error: '❌ Invalid Steam ID.' };
    }

    const appId = Number(config.steam[`gameId${gameKey}`]);

    try {
      const ownedGames = await steamClient.getUserOwnedGames(steamid);
      if (!Array.isArray(ownedGames)) {
        return { error: '⚠️ Unexpected Steam response.' };
      }

      const ownsGame = ownedGames.some((u) => u.game.id === appId);
      return ownsGame
        ? { success: `✅ Verified! You own **${gameKey}**.` }
        : { error: `❌ You do not own **${gameKey}**.` };
    } catch (err) {
      console.error('[ERROR] Steam ownership check failed:', err);
      return { error: '⚠️ Error verifying Steam game ownership.' };
    }
  },
};
