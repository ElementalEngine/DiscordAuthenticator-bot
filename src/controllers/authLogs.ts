import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import client from '../discord';
import { config } from '../config';

export const AuthLogs = {
  logAuth: async (profile: any) => {
    const discord = client as Client;
    const logChannel = discord.channels.cache.get(config.discord.channels.auth_log) as TextChannel;

    if (!logChannel) return console.error('Auth log channel not found.');

    const embed = new EmbedBuilder()
      .setTitle('🔹 User Authentication Attempt')
      .setColor(0x5865F2) // Discord Blue
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
    const authLogChannel = discord.channels.cache.get(config.discord.channels.auth_log) as TextChannel;
    const steamLogChannel = discord.channels.cache.get(config.discord.channels.steam_log) as TextChannel;
  
    if (!authLogChannel || !steamLogChannel) return console.error('One or more log channels not found.');
  
    // Auth log with embed
    const authEmbed = new EmbedBuilder()
      .setTitle('✅ User Successfully Registered')
      .setColor(0x57F287)
      .setThumbnail(`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`)
      .addFields(
        { name: '👤 User', value: `<@${discordUser.id}> (${discordUser.username}#${discordUser.discriminator})`, inline: false },
        { name: '🆔 Discord ID', value: discordUser.id, inline: true },
        { name: '🎮 Steam ID', value: steamId, inline: true }
      )
      .setFooter({ text: 'User Registration Log', iconURL: 'https://discord.com/assets/ffb0f7db0e06c693f7db.png' })
      .setTimestamp();
  
    await authLogChannel.send({ embeds: [authEmbed] });
  
    // Steam log as plain text for easier searching
    await steamLogChannel.send(
      `✅ **New Registration**\n` +
      `**Steam ID:** ${steamId}\n` +
      `**Discord ID:** ${discordUser.id} (<@${discordUser.id}>)`
    );
  },
};