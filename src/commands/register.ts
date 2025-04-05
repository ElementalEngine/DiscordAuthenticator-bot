import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { config } from '../config';
import { findPlayerByDiscordId } from '../database/queries';

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Complete registration to gain access to the server.')
  .addStringOption((option) =>
    option
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
  .addStringOption((option) =>
    option
      .setName('game')
      .setDescription('Select the Civilization game you are playing.')
      .setRequired(true)
      .addChoices(
        { name: 'Civilization VI', value: 'Civ6' },
        { name: 'Civilization VII', value: 'Civ7' }
      )
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    const type = interaction.options.getString('account_type', true);
    const game = interaction.options.getString('game', true);
    const userId = interaction.user.id;

    // Check if user is in the correct channel.
    const welcomeChannelId = process.env.CHANNEL_WELCOME_ID;
    if (interaction.channelId !== welcomeChannelId) {
      return interaction.editReply({ content: `❌ This command can only be used in <#${welcomeChannelId}>.` });
    }

    // Ensure the user has the "non-verified" role.
    const member = interaction.member as GuildMember;
    const nonVerifiedRoleId = process.env.ROLE_NON_VERIFIED!;
    if (!member.roles.cache.has(nonVerifiedRoleId)) {
      return interaction.editReply({
        content: '❌ You do not have the required role to use this command. Only unverified users can register.',
      });
    }

    // Check if the user is already registered (Discord ID check).
    const existingPlayer = await findPlayerByDiscordId(userId);
    if (existingPlayer) {
      return interaction.editReply({
        content: `❌ You are already registered.\n\n**Discord ID:** \`${existingPlayer.discord_id}\`\n**Steam ID:** \`${existingPlayer.steam_id || 'Not linked'}\`\n\nIf this is incorrect, please contact a moderator.`,
      });
    }

    // Restrict Epic, Xbox, and PSN accounts to Civ7 only. For now, only Steam accounts are accepted.
    if ((type !== 'steam') && game !== 'Civ7') {
      return interaction.editReply({
        content: `❌ ${type.toUpperCase()} accounts can **only** register for Civilization VII.`,
      });
    }
    if (type !== 'steam') {
      return interaction.editReply({
        content: `⚠️ Registration for **${type.toUpperCase()}** accounts is not available yet. Please contact a moderator for assistance.`,
      });
    }

    // Create state with three parts: accountType|gameLower|userId
    const state = encodeURIComponent(`${type}|${game.toLowerCase()}|${userId}`);
    const authUrl = `${config.oauth}${state}`;

    return interaction.editReply({
      content: `✅ To complete your registration, please authorize your Steam account:\n\n[Click here to authorize](${authUrl})`,
    });
  } catch (error) {
    console.error('Error executing /register:', error);
    return interaction.editReply({ content: '❌ An unexpected error occurred. Please try again later.' });
  }
};
