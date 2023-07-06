import axios from 'axios'
import { Client, GuildChannel } from 'discord.js'
import { NextFunction, Response } from 'express'
import SteamAPI from 'steamapi'

import { config } from '../config'
import client from '../discord'

export const AuthController = {
  Validate: async (req: any, res: Response, next: NextFunction) => {
    if (!req.query.code) return res.json({ message: 'No code provided' })
    if (!req.query.state)
      return res.json({
        message:
          'Please request a new link from Discord by using /register - this link does not contain your Discord UserID',
      })

    axios
      .post(
        'https://discord.com/api/v7/oauth2/token',
        {
          client_id: config.discord.clientId,
          client_secret: config.discord.clientSecret,
          code: req.query.code,
          grant_type: 'authorization_code',
          redirect_uri: `http://${config.host}:${config.port}`,
          scope: 'identify connections',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
      .then(({ data, status }) => {
        if (status !== 200) return res.json({ message: 'Invalid code' })
        req.access_token = data.access_token
        next()
      })
      .catch((error) => res.json({ error }))
  },

  FetchDiscord: async (req: any, res: Response, next: NextFunction) => {
    if (!req.access_token) return res.json({ message: 'No access token' })
    axios
      .get('https://discord.com/api/v7/users/@me', {
        headers: {
          Authorization: `Bearer ${req.access_token}`,
        },
      })
      .then(({ data, status }) => {
        if (status !== 200) return res.json({ message: 'Invalid access token' })
        req.discord = data
        next()
      })
      .catch((error) => res.json({ error }))
  },

  FetchDiscordConnections: async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.discord) return res.json({ message: 'No discord data' })
    if (req.discord.code)
      return res.json({
        message: 'No discord code provided',
        code: req.discord.code,
      })
    if (req.discord.id !== req.query.state)
      return res.json({
        message:
          'You are logged into two different Discord accounts - one on the website and one in your app. Log out of the website and try again or try again from the website.',
      })
    axios
      .get('https://discord.com/api/v7/users/@me/connections', {
        headers: {
          Authorization: `Bearer ${req.access_token}`,
        },
      })
      .then(({ data, status }) => {
        if (status !== 200)
          return res.json({ message: 'Failed to get Connections.' })
        req.connections = data
        next()
      })
      .catch((error) => res.json({ error }))
  },

  ValidateSteam: async (req: any, res: Response, next: NextFunction) => {
    const steam = req.connections.find(
      (connection: any) => connection.type === 'steam'
    )
    if (!steam)
      return res.json({
        message:
          'Your steam account does not seem to be linked to discord. Please close this window and step through the instructions again',
      })
    req.steam = steam.id
    //  Check all messages in the steam channel to see if steam id is already registered.
    // const player = await Player.findOne({ steam: steam.id })
    // if (player)
    //   return res.json({
    //     message: 'This Steam account is already registered.',
    //   })

    const steamClient = new SteamAPI(config.steam.apiKey)
    steamClient
      .getUserOwnedGames(steam.id)
      .then((results) => {
        const game = results.find(
          (game: any) => game.appID === config.steam.gameId
        )
        if (!game)
          return res.json({
            message:
              'You do not own the game. Please close this window and step through the instructions again',
          })
        if (game.playTime < config.steam.playTime)
          return res.json({
            message: `You do not have enough play time. You have ${game.playTime} minutes, you need ${config.steam.playTime} minutes. Please close this window and step through the instructions again`,
          })
        next()
      })
      .catch((error) => res.json({ error, message: 'Failed to fetch games' }))
  },

  RegisterUser: async (req: any, res: Response) => {
    const discord = client as Client
    const guild = discord.guilds.cache.first()
    await guild?.members.fetch(req.discord.id).then(async (member) => {
      const role = guild?.roles.cache.find(
        ({ id }) => id === config.discord.roles.member
      )
      role && member.roles.add(role)
      await member.send({
        content: 'You have been registered!',
      })
      res.json({ message: 'You have been registered!' })
    })

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
        content: `Steam ID: ${req.steam}\nDiscord ID: ${req.discord.id} (<@${req.discord.id}>)`,
      })
    }
  },
}
