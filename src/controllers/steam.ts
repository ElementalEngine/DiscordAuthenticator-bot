import SteamAPI from 'steamapi';
import { config } from '../config';
import client from '../discord';
import { Player } from '../database/players'

export const SteamController = {
  validate: async (steamid: any, gameIdCiv6: number) => {
    try {
      const steamClient = new SteamAPI(config.steam.apiKey);
      const results = await steamClient.getUserOwnedGames(steamid).catch(console.error);
      const game = results?.find((game: any) => game.game.id === gameIdCiv6);
      if (!game)
        return {
          error: 'You do not own the game. Please close this window and step through the instructions again',
        };
      // if (game.playTime < config.steam.playTime)
      //   return {
      //     error: `You do not have enough play time. You have ${game.playTime} minutes, you need ${config.steam.playTime} minutes. Please close this window and step through the instructions again`,
      //   };
      return { success: true };
    } catch (error) {
      return { error };
    }
  },

  checkFamilyShare: async (steamid: string, game: 'Civ6' | 'Civ7') => {
    try {
      if (!/^\d+$/.test(steamid)) {
        return { error: '❌ Invalid Steam ID. Please provide a valid numeric Steam ID.' };
      }
    } catch (error) {
      console.error('[SteamController] Error checking Family Share:', error);
      return { error: '❌ An error occurred while checking Family Share. Please try again later.' };       
    }
  },

  checkGamesAddRole: async (steamid: string, game: 'Civ6' | 'Civ7') => {
    try {
      if (!/^\d+$/.test(steamid)) {
        return { error: '❌ Invalid Steam ID. Please provide a valid numeric Steam ID.' };
      }
  
      // Map the game name to the corresponding game ID
      const gameId = game === 'Civ6' ? config.steam.gameIdCiv6 : config.steam.gameIdCiv7;
      const steamClient = new SteamAPI(config.steam.apiKey);
      const ownedGames = await steamClient.getUserOwnedGames(steamid);
      if (!ownedGames?.length) {
        return { error: '⚠️ Unable to retrieve your owned games. Make sure your Steam profile is public.' };
      }
  
      // Check if the user owns the selected game
      const ownsGame = ownedGames.some(({ game: { id } }) => id === gameId);
      return ownsGame
        ? { success: `✅ Verified! You own **${game}**.` }
        : { error: `❌ You do not own **${game}** on Steam.` };
  
    } catch (error) {
      console.error('[SteamController] Error checking game ownership:', error);
      return { error: '❌ An error occurred while verifying ownership. Please try again later.' };
    }
  },
};