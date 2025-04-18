import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import client from '../discord/client.js';
import { config } from '../config/index.js';
import type { DiscordProfile, SteamProfile } from '../util/types.js';

export class AuthLogsService {
  static async logRegistration(
    discordUser: DiscordProfile,
    accountType: string,
    accountId: string
  ): Promise<void> {
    const channel = client.channels.cache.get(
      config.discord.channels.reg_log!
    ) as TextChannel;
    if (!channel) return;
    const msg = `✅ **New Registration**\n` +
      `**${accountType.toUpperCase()} ID:** ${accountId}\n` +
      `**Discord ID:** ${discordUser.id} (<@${discordUser.id}>)`;
    await channel.send(msg);
  }

  static async logAuth(profile: DiscordProfile): Promise<void> {
    const channel = client.channels.cache.get(
      config.discord.channels.auth_log!
    ) as TextChannel;
    if (!channel) return;
    const embed = new EmbedBuilder()
      .setTitle('🔹 User Successfully Authenticated')
      .setColor(0x5865F2)
      .setThumbnail(
        profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=256`
          : null        
      )
      .addFields(
        { name: '👤 User', value: `<@${profile.id}> (${profile.username}#${profile.discriminator})` },
        { name: '🆔 Discord ID', value: profile.id, inline: true },
        { name: '📧 Email', value: profile.email || 'Not Available', inline: true },
        { name: '✅ Verified', value: profile.verified ? 'Yes' : 'No', inline: true },
        { name: '🌎 Locale', value: profile.locale || 'Unknown', inline: true },
        { name: '🔒 MFA', value: profile.mfa_enabled ? 'Enabled' : 'Disabled', inline: true },
        { name: '🚀 Nitro', value: profile.premium_type === 2 ? 'Nitro' : profile.premium_type === 1 ? 'Nitro Classic' : 'None', inline: true }
      )
      .setFooter({ text: 'Authentication Log' })  
      .setTimestamp();
    await channel.send({ embeds: [embed] });
  }

  static async logSteamAuth(steamProfile: SteamProfile): Promise<void> {
    console.log('logSteamAuth not implemented yet.');
  }

  static async logXboxAuth(xboxProfile: any): Promise<void> {
    console.log('logXboxAuth not implemented yet.');
  }
}
