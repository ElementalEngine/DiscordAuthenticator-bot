import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from 'discord.js';
import { config } from '../config';
import { SteamController } from '../controllers/steam';
import { Player } from '../database/players';

export const data = new SlashCommandBuilder()
  .setName('addrankedrole')
  .setDescription('Add Civ6 or Civ7 ranked role if you own the game on Steam.')
  .addStringOption((option) =>
    option
      .setName('game')
      .setDescription('Select the Civilization game you are choosing to add.')
      .setRequired(true)
      .addChoices(
        { name: 'Civilization VI', value: 'Civ6' },
        { name: 'Civilization VII', value: 'Civ7' }
      )
  );

type SelectedGame = 'Civ6' | 'Civ7';

export const execute = async (interaction: ChatInputCommandInteraction) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Ensure the environment variable is set
    const allowedChannelId = process.env.CHANNEL_COMMANDS_ID;
    if (!allowedChannelId) {
      console.error('❌ Missing CHANNEL_COMMANDS_ID in environment variables.');
      return interaction.editReply({ content: '❌ Internal configuration error. Please contact an admin.' });
    }

    // Restrict command usage to a specific channel
    if (interaction.channelId !== allowedChannelId) {
      return interaction.editReply({
        content: `❌ This command can only be used in <#${allowedChannelId}>.`,
      });
    }

    const selected: SelectedGame = interaction.options.getString('game', true) as SelectedGame;
    const discordId = interaction.user.id;

    // Retrieve user from database
    const user = await Player.findOne({ discord_id: discordId });
    if (!user) {
      return interaction.editReply({ content: '❌ Your Discord ID was not found in our records.' });
    }

    // Ensure Steam ID is linked
    const steamId = user.steam_id;
    if (!steamId) {
      return interaction.editReply({ content: '❌ You have not linked a Steam ID. Please do so first.' });
    }

    if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply({ content: '❌ I am missing the "Manage Roles" permission to assign your role.' });
    }

    // Determine roles
    const selectedRoleId = config.discord.roles[`${selected}Rank`];
    const opposite: SelectedGame = selected === 'Civ6' ? 'Civ7' : 'Civ6';

    // Fetch the member object
    const member = interaction.guild?.members.cache.get(interaction.user.id) as GuildMember;
    if (!member) {
      return interaction.editReply({ content: '❌ Error retrieving user data.' });
    }

    // Ensure user has at least one ranked role
    const hasCiv6Role = member.roles.cache.has(config.discord.roles.Civ6Rank);
    const hasCiv7Role = member.roles.cache.has(config.discord.roles.Civ7Rank);
    if (!hasCiv6Role && !hasCiv7Role) {
      return interaction.editReply({ content: '❌ You do not have a ranked role. Only Civ6Rank or Civ7Rank users can use this command.' });
    }

    // Ensure user doesn't already have the selected role
    if (member.roles.cache.has(selectedRoleId)) {
      return interaction.editReply({ content: `❌ You already have the **${selected}** ranked role.` });
    }

    // Verify Steam game ownership
    const response = await SteamController.checkGamesAddRole(steamId, selected);
    if (response?.error) {
      return interaction.editReply({ content: response.error });
    }

    // Assign the role
    await member.roles.add(selectedRoleId);
    return interaction.editReply({ content: `✅ Role added successfully! You now have both **${selected}** and **${opposite}** ranked roles.` });

  } catch (error) {
    console.error('Error executing /addrankedrole:', error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ An unexpected error occurred. Please try again later.', ephemeral: true });
    } else {
      await interaction.editReply({ content: '❌ An unexpected error occurred. Please try again later.' });
    }
  }
};
