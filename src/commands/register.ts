import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember
} from 'discord.js';
import { config } from '../config/index.js';
import { findPlayerByDiscordId } from '../database/queries.js';

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Complete registration to gain access to the server.')
  .addStringOption(opt =>
    opt
      .setName('account_type')
      .setDescription('Select the type of account you are registering.')
      .setRequired(true)
      .addChoices(
        { name: 'Epic', value: 'epic' },
        { name: 'Steam', value: 'steam' },
        { name: 'Xbox', value: 'xbox' },
        { name: 'PlayStation (PSN)', value: 'psn' }
      )
  )
  .addStringOption(opt =>
    opt
      .setName('game')
      .setDescription('Select the Civilization game you are playing.')
      .setRequired(true)
      .addChoices(
        { name: 'Civilization VI', value: 'Civ6' },
        { name: 'Civilization VII', value: 'Civ7' }
      )
  );

export const execute = async (
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });

  const type = interaction.options.getString('account_type', true);
  const game = interaction.options.getString('game', true);
  const userId = interaction.user.id;

  // Restrict to welcome channel
  const welcomeChannel = process.env.CHANNEL_WELCOME_ID;
  if (interaction.channelId !== welcomeChannel) {
    await interaction.editReply({
      content: `❌ Use this in <#${welcomeChannel}> only.`
    });
    return;
  }

  // Must have non-verified role
  const member = interaction.member as GuildMember;
  const nonVerified = process.env.ROLE_NON_VERIFIED!;
  if (!member.roles.cache.has(nonVerified)) {
    await interaction.editReply({
      content:
        '❌ Only unverified users can run this command (missing non-verified role).'
    });
    return;
  }

  // Already registered?
  const existing = await findPlayerByDiscordId(userId);
  if (existing) {
    await interaction.editReply({
      content: `❌ Already registered.\nDiscord ID: \`${existing.discord_id}\`\nSteam ID: \`${existing.steam_id ?? 'Not linked'}\``
    });
    return;
  }

  // Only Steam allowed for now
  if (type !== 'steam') {
    if (game !== 'Civ7') {
      await interaction.editReply({
        content: `❌ ${type.toUpperCase()} can only register for Civ7.`
      });
      return;
    }
    await interaction.editReply({
      content: `⚠️ ${type.toUpperCase()} registration not implemented yet.`
    });
    return;
  }

  const state = encodeURIComponent(`${type}|${game.toLowerCase()}|${userId}`);
  const url = `${config.oauth}${state}`;

  await interaction.editReply({
    content: `✅ Click to authorize your Steam account:\n${url}`
  });
};
