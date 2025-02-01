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
    .addStringOption((option) =>
      option
        .setName('game')
        .setDescription('Civilization game to check for. Defaults to Civ6. Options: Civ6 or Civ7')
        .addChoices([
          { name: 'Civilization 6', value: 'Civ6' },
          { name: 'Civilization 7', value: 'Civ7' },
        ])
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // ⛔ Restrict to moderators during registration

  async execute(interaction: ChatInputCommandInteraction) {
    const allowedChannelId = '1126522264460984360'; 

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

    const steamid = interaction.options.getString('steamid', true);
    const game = interaction.options.getString('game') || 'Civ6';

    await interaction.deferReply(); 

    const result = await SteamController.checkFamilyShare(steamid, game); 
    if (result.success) {
      await interaction.editReply(`✅ ${result.success}`);
    } else if (result.warning) {
      await interaction.editReply(`⚠️ ${result.warning}`);
    } else if (result.error) {
      await interaction.editReply(`❌ ${result.error}`);
    }
  },
};