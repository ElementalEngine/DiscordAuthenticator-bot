import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMemberRoleManager } from 'discord.js';
import { SteamController } from '../controllers/steam';

export const data = new SlashCommandBuilder()
  .setName('checkfamilyshare')
  .setDescription('Check if a user is playing Civilization via Steam Family Sharing.')
  .addStringOption(option =>
    option
      .setName('steamid')
      .setDescription("Enter the Steam ID of the user you're checking.")
      .setRequired(true)
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    const botCommandsChannel = process.env.CHANNEL_BOT_COMMANDS_ID!;
    if (interaction.channelId !== botCommandsChannel) {
      return await interaction.reply({
        content: '❌ This command can only be run in the designated bot commands channel.',
        ephemeral: true,
      });
    }

    // Check if the user has the moderator role
    const isModerator = interaction.member?.roles instanceof GuildMemberRoleManager
      && interaction.member.roles.cache.has(process.env.ROLE_MODERATOR!);

    if (!isModerator) {
      return await interaction.reply({
        content: '❌ You do not have the required role to use this command. Only moderators can run this.',
        ephemeral: true,
      });
    }

    // Retrieve the Steam ID
    const steamid = interaction.options.getString('steamid', true);

    await interaction.deferReply({ ephemeral: true });

    // Check Family Share for Civ6 and Civ7
    const civ6Result = await SteamController.checkFamilyShare(steamid, 'Civ6');
    const civ7Result = await SteamController.checkFamilyShare(steamid, 'Civ7');

    // Send the combined results
    const response = `${civ6Result}\n${civ7Result}`;
    await interaction.editReply({ content: response });

  } catch (error) {
    console.error('Error executing /checkfamilyshare command:', error);
    await interaction.editReply({ content: '⚠️ An unexpected error occurred while processing your request.' });
  }
};
