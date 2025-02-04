import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import client from '../discord';
import { config } from '../config';
import { DiscordProfile } from '../util/types'

export const AuthLogs = {
  logAuth: async (profile: DiscordProfile) => {
    const discord = client as Client;
    const logChannel = discord.channels.cache.get(config.discord.channels.auth_log) as TextChannel;

    if (!logChannel) {
      console.error('Auth log channel not found.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🔹 User Successfully Authenticated')
      .setColor(0x5865F2)
      .setThumbnail(`https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=256`)
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

    await logChannel.send({ embeds: [embed] });
  },

  logRegistration: async (discordUser: any, steamId: string) => {
    const discord = client as Client;
    const steamLogChannel = discord.channels.cache.get(config.discord.channels.steam_log) as TextChannel;

    if (!steamLogChannel) {
      console.error('Steam log channel not found.');
      return;
    }

    await steamLogChannel.send(
      `✅ **New Registration**\n` +
      `**Steam ID:** ${steamId}\n` +
      `**Discord ID:** ${discordUser.id} (<@${discordUser.id}>)`
    );
  },
};