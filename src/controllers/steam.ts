import { Client, TextChannel } from 'discord.js';
import SteamAPI from 'steamapi';
import { config } from '../config';
import client from '../discord';
import { Player } from '../database/players'

export const SteamController = {
  validate: async (steamid: any, gameid: number) => {
    try {
      const steamClient = new SteamAPI(config.steam.apiKey);
      const results = await steamClient.getUserOwnedGames(steamid).catch(console.error);
      const game = results?.find((game: any) => game.game.id === gameid);
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

  checkFamilyShare: async (steamid: string, game: string) => {
    // Determine the game ID based on the game name
    const gameId = config.steam[game === 'Civ6' ? 'gameId' : 'gameIdCiv7'];
  
    try {
      // Initialize Steam API client
      const steamClient = new SteamAPI(config.steam.apiKey);
  
      // Use CheckAppOwnership to check if the user owns the game or is using Family Sharing
      const ownershipResponse = await steamClient.getUserOwnedGames(steamid);
      const ownsApp = ownershipResponse.some((game: any) => game.appid === gameId);
  
      if (ownsApp) {
        // User owns the game
        return { success: "User owns Civilization and is not using Family Sharing." };
      }
  
      // If the user doesn't own the game, check for Family Sharing
      const lenderSteamId = (await steamClient.getGameDetails(gameId)).sharedWith;
  
      // Check if lender's Steam ID is available
      if (lenderSteamId) {
        // Look up the lender's Discord ID from the database
        const exists = await Player.findOne({ steam_id: lenderSteamId });
        if (exists) {
          return {
            warning: `User is playing Civilization via Steam Family Sharing.\nLender's Steam ID: **${lenderSteamId}**.\nLender's Discord ID: **${exists.discord_id}**`,
          };
        }
        return {
          warning: `User is playing Civilization via Steam Family Sharing.\nLender's Steam ID: **${lenderSteamId}**.`,
        };
      }
  
      // If the lender's Steam ID is not found, check if the game is being shared (using other checks)
      return { warning: "User is playing Civilization via Family Sharing, but the lender's ID could not be determined." };
  
  
    } catch (error) {
      // Log any errors and return a user-friendly message
      console.error("Error checking family share:", error);
      return { error: "Failed to check family share status. Please try again later." };
    }
  },
};