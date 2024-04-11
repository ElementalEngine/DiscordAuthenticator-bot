import { Client } from 'discord.js'
import { NextFunction, Response } from 'express'

import { config } from '../config'
import client from '../discord'
import { DiscordController } from './discord'
import { SteamController } from './steam'

export const AuthController = {
  authenticate: async (req: any, res: Response, next: NextFunction) => {
    if (!req.query.code) return res.json({ error: 'No code provided' })
    if (!req.query.state)
      return res.json({
        error:
          'Please request a new link from Discord by using /register - this link does not contain your Discord UserID',
      })
    const { access_token, error } = await DiscordController.getAccessToken(
      req.query.code
    )
    if (error) return res.json({ error })

    const { profile, error: profileError } = await DiscordController.getProfile(
      access_token
    )
    if (profileError) return res.json({ error: profileError })
    if (profile.id !== req.query.state)
      return res.json({
        error:
          'You are logged into two different Discord accounts - one on the website and one in your app. Log out of the website and try again or try again from the website.',
      })
    req.discord = profile

    const { connections, error: connectionsError } =
      await DiscordController.getConnections(access_token)
    if (connectionsError) return res.json({ error: connectionsError })
    const steam = connections.find(({ type }: any) => type === 'steam')
    if (!steam)
      return res.json({
        error:
          'Your steam account does not seem to be linked to discord. Please close this window and step through the instructions again',
      })
    const { error: steamError } = await SteamController.validate(steam.id)
    if (steamError) return res.json({ error: steamError })
    req.steamid = steam.id
    next()
  },

  registerUser: async (req: any, res: Response) => {
    const discord = client as Client
    const guild = discord.guilds.cache.first()
    const member = await guild?.members.fetch(req.discord.id)
    if (!member) return res.json({ error: 'Could not find member' })
    const { error: foundError } = await SteamController.checkSteamIdExists(
      req.steamid
    )
    if (foundError) {
      await member.send({ content: `${foundError}` })
      return res.json({ error: foundError })
    }
    const role = guild?.roles.cache.find(
      ({ id }) => id === config.discord.roles.member
    )
    role && member.roles.add(role)

    const welcomeChannel = await guild?.channels.cache.get(
      config.discord.channels.welcome
    )
    if (welcomeChannel?.isTextBased()) {
      await welcomeChannel.send({
        content: `<@${req.discord.id}>, you are now registered.\nPlease read <#${config.discord.channels.rules}> and <#${config.discord.channels.faq}>.`,
      })
    }

    //  Print out the steam id and discord id
    const discordChannel = guild?.channels.cache.get(
      config.discord.channels.discord_logs
    )
    if (discordChannel?.isTextBased()) {
      await discordChannel.send({
        content: `Discord ID: ${req.discord.id} (<@${req.discord.id}>)`,
      })
    }
    const steamChannel = guild?.channels.cache.get(
      config.discord.channels.steam_log
    )
    if (steamChannel?.isTextBased()) {
      await steamChannel.send({
        content: `Steam ID: ${req.steamid}\nDiscord ID: ${req.discord.id} (<@${req.discord.id}>)`,
      })
    }
  },
}
