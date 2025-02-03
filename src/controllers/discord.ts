import axios from 'axios'
import { OAuth2Routes, RouteBases, Routes } from 'discord.js'
import { config } from '../config'

export const DiscordController = {
  getAccessToken: async (code: string) => {
    try {
      const { data } = await axios.post(
        OAuth2Routes.tokenURL,
        {
          client_id: config.discord.clientId,
          client_secret: config.discord.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `http://${config.host}:${config.port}`,
          scope: 'identify connections email',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded', 
          },
        } 
      )
      if (!data.access_token) return { error: 'No access token' }
      return { access_token: data.access_token } 
    } catch (error) {
      return { error }
    }
  },

  getConnections: async (access_token: string) => {
    try {
      const { data } = await axios.get(
        `${RouteBases.api}${Routes.userConnections()}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      if (!data) return { error: 'Failed to fetch Discord connections.' }
      return { connections: data }
    } catch (error) {
      return { error }
    }
  },

  getProfile: async (access_token: string) => {
    try {
      const { data } = await axios.get(
        `${RouteBases.api}${Routes.user('@me')}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
  
      if (!data) return { error: 'Failed to fetch Discord profile.' };

      const profile = {
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
    } catch (error) {
      return { error: 'Failed to retrieve Discord profile.' };
    }
  },
}
