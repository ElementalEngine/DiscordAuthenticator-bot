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

  checkSteamIdExists: async (steamid: string | number) => {
    const discord = client as Client;
    try {
      const channel = discord.channels.cache.get(config.discord.channels.steam_log) as TextChannel;
      const messages = await channel.messages.fetch();
      const found = messages.find(({ content }) => content.includes(`Steam ID: ${steamid}`));
      if (found) {
        const discordid = found.content.split('Discord ID: ')[1].split(' ')[0];
        return { error: `Your Steam ID is already in use by (<@${discordid}>)` };
      }
      return { success: true };
    } catch (error) {
      return { error };
    }
  },

  checkFamilyShare: async (steamid: string, game: string) => {
    const gameId = config.steam[game === 'Civ6' ? 'gameId' : 'gameIdCiv7']

    try {
      const steamClient = new SteamAPI(config.steam.apiKey);
      const ownedGames = await steamClient.getUserOwnedGames(steamid);
      const ownsGame = ownedGames.some((g: any) => g.appid === gameId);

      if (ownsGame) {
        return { success: "User owns Civilization and is not using Family Sharing." };
      }

      const recentGames = await steamClient.getUserRecentGames(steamid);
      const civGame = recentGames.find((g: any) => g.appid === gameId);

      if (!civGame) {
        return { error: "User hasn't played Civilization recently or does not have access to it." };
      }

      const lenderSteamId = await getLenderSteamId(steamid, gameId);
      if (lenderSteamId) {
        //  Check database for lender's Discord ID/name using lenderSteamId
        const exists = await Player.findOne({ steam_id: lenderSteamId })
        if (exists) {
          return {
            warning: `User is playing Civilization via Steam Family Sharing.\nLender's Steam ID: **${lenderSteamId}**.\nLender's Discord ID: **${exists.discord_id}**`,
          };
        }
        return {
          warning: `User is playing Civilization via Steam Family Sharing.\nLender's Steam ID: **${lenderSteamId}**.`,
        };
      }

      return { warning: "User is playing Civilization via Family Sharing, but the lender's ID could not be determined." };
    } catch (error) {
      console.error("Error checking family share:", error);
      return { error: "Failed to check family share status. Please try again later." };
    }
  },
};

// 🛠️ Helper function to get the lender's Steam ID (the account that owns the game)
interface SteamFamilyShareResponse {
  response: {
    lender_steamid: string;
  };
}

const getLenderSteamId = async (steamid: string, gameId: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.steampowered.com/IPlayerService/IsPlayingSharedGame/v1/?key=${config.steam.apiKey}&steamid=${steamid}&appid_playing=${gameId}`
    );

    const data = await response.json() as SteamFamilyShareResponse;

    if (data?.response?.lender_steamid && data.response.lender_steamid !== '0') {
      return data.response.lender_steamid;
    }

    return null;
  } catch (error) {
    console.error('Error fetching lender Steam ID:', error);
    return null;
  }
};