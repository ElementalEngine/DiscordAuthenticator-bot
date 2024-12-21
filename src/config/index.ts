import { CorsOptions } from 'cors'
import { config as env } from 'dotenv'
import path from 'node:path'

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
  clientId: process.env.BOT_CLIENT_ID ?? '',
  token: process.env.BOT_TOKEN ?? '',
  clientSecret: process.env.BOT_CLIENT_SECRET ?? '',
  guildId: process.env.DISCORD_GUILD_ID ?? '',
  channels: {
    auth_log: process.env.CHANNEL_AUTHBOT_LOG_ID!,
    welcome: process.env.CHANNEL_WELCOME!,
    discord_logs: process.env.CHANNEL_DISCORD_ID!,
    steam_log: process.env.CHANNEL_STEAM_ID!,
    epic_log: process.env.CHANNEL_EPIC_ID!,
    rules: process.env.CHANNEL_RULES!,
    faq: process.env.CHANNEL_FAQ!,
  },
  roles: {
    admin: process.env.ROLE_ADMIN!,
    member: process.env.ROLE_VERIFIED!,
    epic: process.env.ROLE_EPIC!,
    steam: process.env.ROLE_STEAM!,
  },
}

const steam = {
  apiKey: process.env.STEAM_API_KEY ?? '',
  gameId: 289070,
  playTime: 120,
}

const epic = {
  apiKey: process.env.EPIC_API_KEY ?? '',
  gameId: 'rocket-league',
  playtime: 120,
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
  mongoDb: process.env.MONGO_URL!
}
