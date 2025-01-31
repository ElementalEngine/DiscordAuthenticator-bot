import axios from 'axios'
import { config } from '../config'

export const DiscordController = {
  getAccessToken: async (code: string) => {
    try {
      const { data } = await axios.post(
        'https://discord.com/api/v7/oauth2/token',
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
        'https://discord.com/api/v7/users/@me/connections',
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
      const { data } = await axios.get('https://discord.com/api/v7/users/@me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      if (!data) return { error: 'Failed to fetch Discord profile.' }

      return {
        profile: {
          id: data.id,
          username: data.username,
          discriminator: data.discriminator,
          email: data.email, 
          verified: data.verified,
          locale: data.locale,
          mfa_enabled: data.mfa_enabled,
          premium_type: data.premium_type, // 0 = None, 1 = Nitro Classic, 2 = Nitro
        },
      }
    } catch (error) {
      return { error }
    }
  },
}
