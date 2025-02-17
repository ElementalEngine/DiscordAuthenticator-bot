import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import client from '../discord';
import { config } from '../config';
import { DiscordProfile, SteamProfile } from '../util/types';

export const AuthLogs = {
  // Log a new registration event in the designated registration channel.
  logRegistration: async (discordUser: any, accountType: string, accountId: string): Promise<void> => {
    try {
      const discordClient = client as Client;
      const regLogChannel = discordClient.channels.cache.get(config.discord.channels.reg_log) as TextChannel;
      if (!regLogChannel) {
        console.error('Registration log channel not found.');
        return;
      }
      const message = `✅ **New Registration**\n**${accountType.toUpperCase()} ID:** ${accountId}\n**Discord ID:** ${discordUser.id} (<@${discordUser.id}>)`;
      await regLogChannel.send(message);
    } catch (error) {
      console.error('[AuthLogs] logRegistration failed:', error instanceof Error ? error.message : error);
    }
  },

  // Log a successful authentication event using an embed.
  logAuth: async (profile: DiscordProfile): Promise<void> => {
    try {
      const discordClient = client as Client;
      const authLogChannel = discordClient.channels.cache.get(config.discord.channels.auth_log) as TextChannel;
      if (!authLogChannel) {
        console.error('Auth log channel not found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle('🔹 User Successfully Authenticated')
        .setColor(0x5865F2)
        .setThumbnail(
          profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=256`
            : ''
        )
        .addFields(
          { name: '👤 User', value: `<@${profile.id}> (${profile.username}#${profile.discriminator})`, inline: false },
          { name: '🆔 Discord ID', value: profile.id, inline: true },
          { name: '📧 Email', value: profile.email || 'Not Available', inline: true },
          { name: '✅ Verified', value: profile.verified ? '✅ Yes' : '❌ No', inline: true },
          { name: '🌎 Locale', value: profile.locale || 'Unknown', inline: true },
          { name: '🔒 MFA Enabled', value: profile.mfa_enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🚀 Nitro Status', value: profile.premium_type === 2 ? 'Nitro' : profile.premium_type === 1 ? 'Nitro Classic' : 'None', inline: true }
        )
        .setFooter({ text: 'Authentication Log', iconURL: 'https://discord.com/assets/ffb0f7db0e06c693f7db.png' })
        .setTimestamp();
      await authLogChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('[AuthLogs] logAuth failed:', error instanceof Error ? error.message : error);
    }
  },

  // Placeholder for future Steam authentication logging.
  logSteamAuth: async (steamProfile: SteamProfile): Promise<void> => {
    console.log('logSteamAuth not implemented yet.');
  },

  // Placeholder for future Xbox authentication logging.
  logXboxAuth: async (xboxProfile: any): Promise<void> => {
    console.log('logXboxAuth not implemented yet.');
  },
};
