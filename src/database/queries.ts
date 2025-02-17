import { Player } from '../database/players';

/**
 * Finds a player by Discord ID
 */
export const findPlayerByDiscordId = async (discordId: string) => {
  return await Player.findOne({ discord_id: discordId }).lean();
};

/**
 * Finds a player by Steam ID
 */
export const findPlayerBySteamId = async (steamId: string) => {
  return await Player.findOne({ steam_id: steamId }).lean();
};

/**
 * Updates a player's Steam ID
 */
export const updatePlayerSteamId = async (discordId: string, steamId: string) => {
  return await Player.findOneAndUpdate(
    { discord_id: discordId },
    { steam_id: steamId },
    { new: true }
  );
};

/**
 * Updates a player's Discord ID.
 */
export const updatePlayerDiscordId = async (currentDiscordId: string, newDiscordId: string) => {
  return await Player.findOneAndUpdate(
    { discord_id: currentDiscordId },
    { discord_id: newDiscordId },
    { new: true }
  );
};

/**
 * Creates a new player entry
 */
export const createPlayer = async (discordId: string, steamId: string, userName: string, displayName: string) => {
  const newPlayer = new Player({ discord_id: discordId, steam_id: steamId, user_name: userName, display_name: displayName });
  return await newPlayer.save();
};
