import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMemberRoleManager } from 'discord.js';
import { config } from '../config';
import { Player } from '../database/players';

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
  const type = interaction.options.getString('account_type') || 'steam';
  const game = interaction.options.getString('game') || 'Civ6';

  // Ensure the command is used in the correct channel
  if (interaction.channelId !== process.env.CHANNEL_WELCOME) {
    return await interaction.reply({
      content: `This command can only be used in <#${process.env.CHANNEL_WELCOME}>`,
      ephemeral: true,
    });
  }

  // Check if the user has the 'Non-Verified' role
  const hasNonVerifiedRole = interaction.member 
    && interaction.member.roles instanceof GuildMemberRoleManager 
    && interaction.member.roles.cache.has(process.env.ROLE_NON_VERIFIED!);

  if (!hasNonVerifiedRole) {
    return await interaction.reply({
      content: '❌ You do not have the required role to use this command. Only non-verified users can run this.',
      ephemeral: true,
    });
  }

  // Check if the user is already registered (by Discord ID)
  const existingPlayer = await Player.findOne({ discord_id: interaction.user.id });
  if (existingPlayer) {
    return await interaction.reply({
      content: `❌ You are already registered.\n\n**Discord ID:** \`${existingPlayer.discord_id}\`\n**Steam ID:** \`${existingPlayer.steam_id || 'No Steam ID linked'}\`\n\nPlease provide this information to a moderator if needed.`,
      ephemeral: true,
    });
  }

  // Check if the Steam ID is already registered under another Discord account
  const linkedSteam = await Player.findOne({ steam_id: interaction.user.id });
  if (linkedSteam && linkedSteam.discord_id !== interaction.user.id) {
    return await interaction.reply({
      content: `⚠️ This Steam account is already linked to another Discord user.\n\n**Registered Discord ID:** \`${linkedSteam.discord_id}\`\n\nIf this is a mistake, please contact a moderator.`,
      ephemeral: true,
    });
  }

  // If the user selects 'Epic', 'Xbox', or 'PSN', they can **only** select Civilization VII
  if ((type === 'epic' || type === 'xbox' || type === 'psn') && game !== 'Civ7') {
    return await interaction.reply({
      content: `❌ ${type.toUpperCase()} accounts can only register for Civilization VII.`,
      ephemeral: true,
    });
  }

  // If the user selects 'Epic', 'Xbox', or 'PSN', reject them
  if (type === 'epic' || type === 'xbox' || type === 'psn') {
    return await interaction.reply({
      content: `⚠️ Registration for ${type.toUpperCase()} accounts is not available yet. Please contact a moderator for assistance.`,
      ephemeral: true,
    });
  }

  // Generate OAuth link (only for Steam users)
  const state = encodeURIComponent(`${game.toLowerCase()}|${interaction.user.id}|${type}`);
  return await interaction.reply({
    content: `✅ The CPL Bot needs authorization to verify your linked Steam account.\n\n[Click here to authorize](${config.oauth}${state})`,
    ephemeral: true,
  });
};
