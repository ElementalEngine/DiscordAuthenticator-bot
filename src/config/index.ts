import cors, { CorsOptions } from 'cors';
import { config as env } from 'dotenv';
import path from 'node:path';
import { SteamConfig } from '../util/types';

env({ path: path.resolve('./.env') });

const corsOptions: CorsOptions = {
  origin: process.env.CORS ?? '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  exposedHeaders: ['x-auth-token'],
};

const discord = {
  clientId: process.env.BOT_CLIENT_ID ?? '',
  token: process.env.BOT_TOKEN ?? '',
  clientSecret: process.env.BOT_CLIENT_SECRET ?? '',
  guildId: process.env.DISCORD_GUILD_ID ?? '',
  channels: {
    welcome: process.env.CHANNEL_WELCOME_ID!,
    channel_list: process.env.CHANNEL_LIST_ID!,
    faq: process.env.CHANNEL_FAQ_ID!,
    info_hub: process.env.CHANNEL_INFORMATION_HUB_ID!,
    auth_log: process.env.CHANNEL_AUTHBOT_LOG_ID!,
    reg_log: process.env.CHANNEL_AUTHBOT_REG_ID!,
    commands_civ6: process.env.CHANNEL_COMMANDS_CIV6_ID!,
    commands_civ7: process.env.CHANNEL_COMMANDS_CIV7_ID!,
    bot_commands: process.env.CHANNEL_BOT_COMMANDS_ID!,
  },
  roles: {
    moderator: process.env.ROLE_MODERATOR!,
    Civ6Rank: process.env.ROLE_CIV6!,
    Civ7Rank: process.env.ROLE_CIV7!,
    novice: process.env.ROLE_NOVICE!,
    non_verified: process.env.ROLE_NON_VERIFIED!,
    manually_verify: process.env.ROLE_MANUALLY_VERIFY!,
  },
};

export const steam: SteamConfig = {
  apiKey: process.env.STEAM_API_KEY ?? '',
  partnerApiKey: process.env.STEAM_PARTNER_API_KEY ?? '',
  gameIdCiv6: 289070,
  playTimeCiv6: 2880,
  gameIdCiv7: 1295660,
  playTimeCiv7: 120,
};

export const config = {
  oauth: [
    `https://discord.com/api/oauth2/authorize`,
    `?client_id=${discord.clientId}`,
    `&redirect_uri=${encodeURIComponent(
    `http://${process.env.HOST!}:${process.env.PORT!}/auth/callback`
    )}`,
    `&response_type=code`,
    `&scope=identify%20connections`,
    `&state=`
  ].join(''),
  cors: corsOptions,
  discord,
  host: process.env.HOST!,
  port: Number(process.env.PORT!),
  steam,
  mongoDb: process.env.MONGO_URL!,
};
