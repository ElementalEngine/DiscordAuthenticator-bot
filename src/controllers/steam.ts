import SteamAPI from 'steamapi';
import { config } from '../config';

const steamClient = new SteamAPI(config.steam.apiKey);

export const SteamController = {
  // Validate that the user owns the game and meets the required playtime.
  validate: async (steamid: string, gameKey: 'Civ6' | 'Civ7'): Promise<string> => {
    try {
      // Get the app ID and required playtime from config using the game key.
      const appId = Number(config.steam[`gameId${gameKey}`]);
      const requiredPlayTime = Number(config.steam[`playTime${gameKey}`]);
      if (!appId || !requiredPlayTime) return '❌ Invalid game selection.';
      
      console.log(`[INFO] Validating SteamID: ${steamid} for ${gameKey} (AppID: ${appId})`);
      
      // Retrieve the list of games owned by the user.
      const ownedGames = await steamClient.getUserOwnedGames(steamid);
      if (!Array.isArray(ownedGames) || ownedGames.length === 0) {
        return '⚠️ No games found or failed to retrieve games from Steam.';
      }
      
      // Check if the user owns the specified game.
      const game = ownedGames.find((g: any) => g.game.id === appId);
      if (!game) return '❌ You do not own this game, or your profile is set to private.';
      
      console.log(`[INFO] Playtime for ${gameKey}: ${game.minutes} minutes`);
      // Check if the playtime meets the requirement.
      if (game.minutes < requiredPlayTime) {
        return `❌ Insufficient playtime: ${game.minutes} minutes (Required: ${requiredPlayTime} minutes).`;
      }
      
      // Return an empty string to indicate success.
      return '';
    } catch (error) {
      console.error('[ERROR] Steam validation failed:', error instanceof Error ? error.message : error);
      return '⚠️ An error occurred during Steam validation.';
    }
  },

  // TODO: Implement detailed account information retrieval.
  checkAccountDetails: async (steamid: string): Promise<string> => {
    return '⚠️ checkAccountDetails not implemented yet.';
  },

  // Verify game ownership for role assignment.
  checkGamesAddRole: async (steamid: string, game: 'Civ6' | 'Civ7'): Promise<{ success?: string; error?: string }> => {
    if (!/^\d+$/.test(steamid)) return { error: '❌ Invalid Steam ID.' };

    const appId = Number(config.steam[`gameId${game}`]);
    try {
      const ownedGames = await steamClient.getUserOwnedGames(steamid);
      if (!Array.isArray(ownedGames)) return { error: '⚠️ Unexpected Steam response.' };
      
      // Check if the user owns the specified game.
      const ownsGame = ownedGames.some(({ game: { id } }: any) => id === appId);
      return ownsGame
        ? { success: `✅ Verified! You own **${game}**.` }
        : { error: `❌ You do not own **${game}**.` };
    } catch (error) {
      console.error('[ERROR] Steam ownership check failed:', error);
      return { error: '⚠️ Error verifying Steam game ownership.' };
    }
  },
};