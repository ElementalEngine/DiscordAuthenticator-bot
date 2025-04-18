import axios from 'axios';
import querystring from 'node:querystring';
import { OAuth2Routes, RouteBases, Routes } from 'discord.js';
import { config } from '../config/index.js';
import type { DiscordProfile } from '../util/types.js';

export class DiscordService {
  static async getAccessToken(code: string): Promise<{ access_token?: string; error?: string }> {
    const payload = querystring.stringify({
      client_id:     config.discord.clientId,
      client_secret: config.discord.clientSecret,
      code:          code.trim(),
      grant_type:    'authorization_code',
      redirect_uri:  `http://${config.host}:${config.port}`,
      scope:         'identify connections email',
    });
    try {
      const { data } = await axios.post(OAuth2Routes.tokenURL, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return data.access_token
        ? { access_token: data.access_token }
        : { error: 'No access token received from Discord.' };
    } catch (err: any) {
      return { error: err.message || 'Unknown error' };
    }
  }

  static async getProfile(access_token: string): Promise<{ profile?: DiscordProfile; error?: string }> {
    try {
      const { data } = await axios.get(
        `${RouteBases.api}${Routes.user('@me')}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      if (!data?.id) return { error: 'Failed to fetch Discord profile.' };
      return {
        profile: {
          id:            data.id,
          username:      data.username,
          global_name:   data.global_name,
          discriminator: data.discriminator,
          email:         data.email,
          verified:      data.verified,
          locale:        data.locale,
          mfa_enabled:   data.mfa_enabled,
          premium_type:  data.premium_type,
          avatar:        data.avatar,
        }
      };
    } catch (err: any) {
      return { error: err.message || 'Unknown error' };
    }
  }

  static async getConnections(access_token: string): Promise<{ connections?: any; error?: string }> {
    try {
      const { data } = await axios.get(
        `${RouteBases.api}${Routes.userConnections()}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      return data ? { connections: data } : { error: 'No connections data.' };
    } catch (err: any) {
      return { error: err.message || 'Unknown error' };
    }
  }
}
