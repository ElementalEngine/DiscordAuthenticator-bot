import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { SteamController } from '../controllers/steam';

export const checkFamilyShareCommand = {
  data: new SlashCommandBuilder()
    .setName('checkfamilyshare')
    .setDescription('Check if a user is playing Civilization via Steam Family Sharing.')
    .addStringOption((option) =>
      option
        .setName('steamid')
        .setDescription("The Steam ID of the user you're checking.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // ⛔ Restrict to moderators during registration

  async execute(interaction: ChatInputCommandInteraction) {
    const allowedChannelId = 'CHANNEL_ID'; 

    if (interaction.channelId !== allowedChannelId) {
      return interaction.reply({
        content: `❌ This command can only be used in <#${allowedChannelId}>.`,
        ephemeral: true, 
      });
    }
    // Check if the user has mod permissions (this check is crucial for runtime security)
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true, 
      });
    }

    const steamid = interaction.options.getString('steamid', true);

    await interaction.deferReply(); 

    const result = await SteamController.checkFamilyShare(steamid); 
    if (result.success) {
      await interaction.editReply(`✅ ${result.success}`);
    } else if (result.warning) {
      await interaction.editReply(`⚠️ ${result.warning}`);
    } else if (result.error) {
      await interaction.editReply(`❌ ${result.error}`);
    }
  },
};