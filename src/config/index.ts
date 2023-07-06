import { CorsOptions } from 'cors'
import { config as env } from 'dotenv'
import path from 'path'

env({
  path: path.resolve('./.env'),
})

const cors: CorsOptions = {
  origin: process.env.CORS ?? '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  exposedHeaders: ['x-auth-token'],
}

const discord = {
  clientId: process.env.DISCORD_CLIENT_ID ?? '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
  guildId: process.env.DISCORD_GUILD_ID ?? '',
  token: process.env.DISCORD_TOKEN ?? '',
  channels: {
    welcome: process.env.CHANNEL_WELCOME!,
    discord_logs: process.env.CHANNEL_DISCORD_ID!,
    steam_log: process.env.CHANNEL_STEAM_ID!,
    epic_log: process.env.CHANNEL_EPIC_ID!,
  },
  roles: {
    admin: process.env.ROLE_ADMIN!,
    member: process.env.ROLE_MEMBER!,
  },
}

const steam = {
  apiKey: process.env.STEAM_API_KEY ?? '',
  gameId: 289070,
  playTime: 120,
}

export const config = {
  oauth: `https://discord.com/api/oauth2/authorize?client_id=${
    discord.clientId
  }&redirect_uri=http%3A%2F%2F${process.env.HOST!}:${process.env
    .PORT!}&response_type=code&scope=identify%20connections&state=`,
  cors,
  discord,
  host: process.env.HOST!,
  port: Number(process.env.PORT!),
  steam,
}
