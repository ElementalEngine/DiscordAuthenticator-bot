import axios from 'axios';
import querystring from 'node:querystring';
import { OAuth2Routes, RouteBases, Routes } from 'discord.js';
import { config } from '../config';
import { DiscordProfile } from '../util/types';

export const DiscordController = {
  // Exchange an OAuth2 code for an access token.
  getAccessToken: async (code: string): Promise<{ access_token?: string; error?: string }> => {
    try {
      // Build and URL-encode the payload for the token request.
      const payload = querystring.stringify({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        code: code.trim(),
        grant_type: 'authorization_code',
        redirect_uri: `http://${config.host}:${config.port}`,
        scope: 'identify connections email',
      });

      // Request the access token from Discord.
      const { data } = await axios.post(OAuth2Routes.tokenURL, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      if (!data?.access_token) return { error: 'No access token received from Discord.' };
      return { access_token: data.access_token };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DiscordController] getAccessToken failed:', errMsg);
      return { error: errMsg };
    }
  },

  // Retrieve connected accounts (e.g., Steam, Xbox) for the user.
  getConnections: async (access_token: string): Promise<{ connections?: any; error?: string }> => {
    try {
      const { data } = await axios.get(`${RouteBases.api}${Routes.userConnections()}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!data) return { error: 'Failed to fetch Discord connections.' };
      return { connections: data };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DiscordController] getConnections failed:', errMsg);
      return { error: errMsg };
    }
  },

  // Retrieve the Discord profile for the authenticated user.
  getProfile: async (access_token: string): Promise<{ profile?: DiscordProfile; error?: string }> => {
    try {
      const { data } = await axios.get(`${RouteBases.api}${Routes.user('@me')}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!data || !data.id) return { error: 'Failed to fetch Discord profile.' };

      // Build the profile object from the returned data.
      const profile: DiscordProfile = {
        id: data.id,
        username: data.username,
        global_name: data.global_name,
        discriminator: data.discriminator,
        email: data.email || 'Not Available',
        verified: data.verified,
        locale: data.locale || 'Unknown',
        mfa_enabled: data.mfa_enabled,
        premium_type: data.premium_type,
        avatar: data.avatar,
      };
      return { profile };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DiscordController] getProfile failed:', errMsg);
      return { error: errMsg };
    }
  },
};