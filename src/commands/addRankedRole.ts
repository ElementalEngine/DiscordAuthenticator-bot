import {ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits 
} from 'discord.js';
import { config } from '../config';
import { SteamController } from '../controllers/steam';
import { findPlayerByDiscordId } from '../database/queries';

export const data = new SlashCommandBuilder()
  .setName('addrankedrole')
  .setDescription('Add Civ6 or Civ7 ranked role if you own the game on Steam.')
  .addStringOption(option =>
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
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Validate allowed channels
    const civ6Channel = process.env.CHANNEL_COMMANDS_CIV6_ID;
    const civ7Channel = process.env.CHANNEL_COMMANDS_CIV7_ID;
    if (!civ6Channel || !civ7Channel) {
      console.error('❌ Missing required channel environment variables.');
      return interaction.editReply({ content: '❌ Internal configuration error. Please contact an admin.' });
    }
    if (![civ6Channel, civ7Channel].includes(interaction.channelId)) {
      return interaction.editReply({
        content: '❌ This command can only be used in the designated Civ6 or Civ7 command channels.'
      });
    }
    
    // Retrieve command options and user info
    const selected = interaction.options.getString('game', true) as SelectedGame;
    const discordId = interaction.user.id;
    
    // Get user from DB using centralized query
    const user = await findPlayerByDiscordId(discordId);
    if (!user) {
      return interaction.editReply({ content: '❌ Your Discord ID was not found in our records.' });
    }
    
    // Ensure a Steam ID is linked
    if (!user.steam_id) {
      return interaction.editReply({ content: '❌ You have not linked a Steam ID. Please link your Steam account first.' });
    }
    
    // Ensure the bot has permission to manage roles
    if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply({ content: '❌ I am missing the "Manage Roles" permission to assign your role.' });
    }
    
    // Retrieve the Discord member
    const member = interaction.guild?.members.cache.get(discordId) as GuildMember;
    if (!member) {
      return interaction.editReply({ content: '❌ Error retrieving your member data.' });
    }
    
    // Check if the member already has any ranked role
    const rankedRoles = [config.discord.roles.Civ6Rank, config.discord.roles.Civ7Rank];
    const hasRankedRole = rankedRoles.some(roleId => member.roles.cache.has(roleId));
    if (!hasRankedRole) {
      return interaction.editReply({ content: '❌ You do not have a ranked role. Only users with a ranked role can use this command.' });
    }
    
    // Determine the role to add and ensure it isn’t already assigned
    const selectedRoleId = config.discord.roles[`${selected}Rank`];
    if (member.roles.cache.has(selectedRoleId)) {
      return interaction.editReply({ content: `❌ You already have the **${selected}** ranked role.` });
    }
    
    // Verify Steam game ownership
    const steamCheck = await SteamController.checkGamesAddRole(user.steam_id, selected);
    if (steamCheck?.error) {
      return interaction.editReply({ content: steamCheck.error });
    }
    
    // Assign the role
    await member.roles.add(selectedRoleId);
    return interaction.editReply({ content: `✅ Role added successfully! You now have the **${selected}** ranked role.` });
    
  } catch (error) {
    console.error('Error executing /addrankedrole:', error);
    return interaction.editReply({ content: '❌ An unexpected error occurred. Please try again later.' });
  }
};
