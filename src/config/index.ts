import e, { CorsOptions } from 'cors'
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
    welcome: process.env.CHANNEL_WELCOME!,
    channel_list: process.env.CHANNEL_LIST!,
    info_hub: process.env.CHANNEL_INFORMATION_HUB!,
    auth_log: process.env.CHANNEL_AUTHBOT_LOG_ID!,
    steam_log: process.env.CHANNEL_STEAM_ID!,
    commands: process.env.CHANNEL_COMMANDS_ID!,
    bot_commands: process.env.CHANNEL_BOT_COMMANDS_ID!,
  },
  roles: {
    moderator: process.env.ROLE_MODERATOR!,
    admin: process.env.ROLE_ADMIN!,
    Civ6Rank: process.env.ROLE_CIV6!,
    Civ7Rank: process.env.ROLE_CIV7!,
    non_verified: process.env.ROLE_NON_VERIFIED!,
  },
}

const steam = {
  apiKey: process.env.STEAM_API_KEY ?? '',
  gameIdCiv6: 289070,
  playTime: 120,
  gameIdCiv7: 1295660,
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
