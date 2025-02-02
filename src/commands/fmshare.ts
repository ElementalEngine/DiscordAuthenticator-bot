import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { SteamController } from '../controllers/steam';

const allowedChannelId = '1323303305098690593';

export const data = new SlashCommandBuilder()
  .setName('checkfamilyshare')
  .setDescription('Check if a user is playing Civilization via Steam Family Sharing.')
  .addStringOption((option) =>
    option
      .setName('game')
      .setDescription('Select the Civilization game to check for.')
      .setRequired(true)
      .addChoices(
        { name: 'Civilization 6', value: 'Civ6' },
        { name: 'Civilization 7', value: 'Civ7' }
      )
  )
  .addStringOption((option) =>
    option
      .setName('steamid')
      .setDescription("Enter the Steam ID of the user you're checking.")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Check if the command is used in the allowed channel
    if (!isAllowedChannel(interaction, allowedChannelId)) {
      return interaction.reply({
        content: `❌ This command can only be used in <#${allowedChannelId}>.`,
        ephemeral: true,
      });
    }

    // Check if the user has the required permissions
    if (!hasPermission(interaction)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    // Get options from interaction
    const game = interaction.options.getString('game', true);
    const steamid = interaction.options.getString('steamid', true);

    // Validate Steam ID format
    if (!validateSteamId(steamid)) {
      return interaction.reply({
        content: '❌ Invalid Steam ID. Please provide a valid numeric Steam ID.',
        ephemeral: true,
      });
    }

    // Rate-limiting check
    if (isRateLimited(interaction.user.id)) {
      return interaction.reply({
        content: '⚠️ You are using this command too frequently. Please wait a minute before trying again.',
        ephemeral: true,
      });
    }

    await interaction.deferReply(); // Avoid bot timeout while processing

    // Execute Steam Family Share check
    const result = await SteamController.checkFamilyShare(steamid, game);

    // Construct response message
    let responseMessage = '❌ An unexpected error occurred.';
    if (result.success) {
        responseMessage = `✅ ${result.success}`;
    } else if (result.warning) {
        responseMessage = `⚠️ ${result.warning}`;
    } else if (result.error) {
        responseMessage = `❌ ${result.error}`;
    }

    await interaction.editReply(responseMessage);
    } catch (error) {
    console.error('Error executing /checkfamilyshare command:', error);
    await interaction.editReply('⚠️ An unexpected error occurred while processing your request.');
    }
}