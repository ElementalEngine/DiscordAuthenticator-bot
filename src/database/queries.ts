import { Player } from './models/players.model.js';
import type { IPlayer } from './models/players.model.js';

// Finds a player by Discord ID
export const findPlayerByDiscordId = (
  discordId: string
): Promise<IPlayer | null> => {
  return Player
    .findOne({ discord_id: discordId })
    .lean()
    .exec();
};

// Finds a player by Steam ID
export const findPlayerBySteamId = (
  steamId: string
): Promise<IPlayer | null> => {
  return Player
    .findOne({ steam_id: steamId })
    .lean()
    .exec();
};

// Updates a player's Steam ID
export const updatePlayerSteamId = (
  discordId: string,
  steamId: string
): Promise<IPlayer | null> => {
  return Player
    .findOneAndUpdate(
      { discord_id: discordId },
      { steam_id: steamId },
      { new: true, runValidators: true }
    )
    .exec();
};

// Updates a player's Discord ID
export const updatePlayerDiscordId = (
  currentDiscordId: string,
  newDiscordId: string
): Promise<IPlayer | null> => {
  return Player
    .findOneAndUpdate(
      { discord_id: currentDiscordId },
      { discord_id: newDiscordId },
      { new: true, runValidators: true }
    )
    .exec();
};

// Creates a new player entry in the database
export const createPlayer = (
  discordId: string,
  steamId: string,
  userName: string,
  displayName: string
): Promise<IPlayer> => {
  return new Player({
    discord_id:   discordId,
    steam_id:     steamId,
    user_name:    userName,
    display_name: displayName,
  }).save();
};
