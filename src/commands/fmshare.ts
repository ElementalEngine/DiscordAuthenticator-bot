import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { SteamController } from '../controllers/steam';

export const data = new SlashCommandBuilder()
    .setName('checkfamilyshare')
    .setDescription('Check if a user is playing Civilization via Steam Family Sharing.')
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Select the Civilization game to check for.')
        .setRequired(true)
        .addChoices([
          { name: 'Civilization 6', value: 'Civ6' },
          { name: 'Civilization 7', value: 'Civ7' },
        ])
    )
    .addStringOption((option) =>
      option
        .setName('steamid')
        .setDescription("Enter the Steam ID of the user you're checking.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
    const allowedChannelId = '1323303305098690593';

    if (interaction.channelId !== allowedChannelId) {
        return interaction.reply({
            content: `❌ This command can only be used in <#${allowedChannelId}>.`,
            ephemeral: true,
        });
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
            content: '❌ You do not have permission to use this command.',
            ephemeral: true,
        });
    }

    try {
        const game = interaction.options.getString('game', true); // Game selection is now required first
        const steamid = interaction.options.getString('steamid', true); // Then Steam ID

        await interaction.deferReply();

        const result = await SteamController.checkFamilyShare(steamid, game);

        if (result.success) {
            await interaction.editReply(`✅ ${result.success}`);
        } else if (result.warning) {
            await interaction.editReply(`⚠️ ${result.warning}`);
        } else {
            await interaction.editReply(`❌ ${result.error}`);
        }
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.editReply('❌ An unexpected error occurred while processing the request.');
    }
}