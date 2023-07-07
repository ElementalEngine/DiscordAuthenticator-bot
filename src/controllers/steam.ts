import { Client, TextChannel } from 'discord.js'
import SteamAPI from 'steamapi'

import { config } from '../config'
import client from '../discord'

export const SteamController = {
  validate: async (steamid: any) => {
    try {
      const steamClient = new SteamAPI(config.steam.apiKey)
      const results = await steamClient
        .getUserOwnedGames(steamid)
        .catch(console.error)
      const game = results?.find(
        (game: any) => game.appID === config.steam.gameId
      )
      if (!game)
        return {
          error:
            'You do not own the game. Please close this window and step through the instructions again',
        }
      if (game.playTime < config.steam.playTime)
        return {
          error: `You do not have enough play time. You have ${game.playTime} minutes, you need ${config.steam.playTime} minutes. Please close this window and step through the instructions again`,
        }
      return { success: true }
    } catch (error) {
      return { error }
    }
  },

  checkSteamIdExists: async (steamid: string | number) => {
    const discord = client as Client
    try {
      const channel = discord.channels.cache.get(
        config.discord.channels.steam_log
      ) as TextChannel
      const messages = await channel.messages.fetch()
      const found = messages.find(({ content }) =>
        content.includes(`Steam ID: ${steamid}`)
      )
      if (found) {
        const discordid = found.content.split('Discord ID: ')[1].split(' ')[0]
        return { error: `Your Steam ID is already in use by (<@${discordid}>)` }
      }
      return { success: true }
    } catch (error) {
      return { error }
    }
  },
}
