import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from 'discord.js';
import { config } from '../config';
import { SteamController } from '../controllers/steam';
import { Player } from '../database/players'; // Assuming you have a Player model

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
    const selected: SelectedGame = interaction.options.getString('game', true) as SelectedGame;
    const discordId = interaction.user.id;

    // Look up the user in the database by discordId
    const user = await Player.findOne({ discord_id: discordId });
    if (!user) {
      return interaction.reply({
        content: '❌ We could not find your Steam ID in our records. Please link your Steam account first.',
        ephemeral: true, 
      });
    }

    // Get steamId from the database
    const steamId = user.steam_id;
    if (!steamId) {
      return interaction.reply({
        content: '❌ You have not linked a Steam ID to your account. Please link your Steam account first.',
        ephemeral: true, 
      });
    }

    const selectedRoleId = config.discord.roles[`${selected}Rank`];
    const opposite: SelectedGame = selected === 'Civ6' ? 'Civ7' : 'Civ6';
    const member = interaction.guild?.members.cache.get(interaction.user.id) as GuildMember;
    if (!member) {
      return interaction.reply({
        content: '❌ Error retrieving user data.',
        ephemeral: true, 
      });
    }

    // Check if user has NO ranked role at all (they shouldn't be able to use this command)
    const hasCiv6Role = member.roles.cache.has(config.discord.roles.Civ6Rank);
    const hasCiv7Role = member.roles.cache.has(config.discord.roles.Civ7Rank);

    if (!hasCiv6Role && !hasCiv7Role) {
      return interaction.reply({
        content: '❌ You do not have a ranked role. Only users with **Civ6Rank** or **Civ7Rank** can use this command.',
        ephemeral: true, 
      });
    }

    // Check if user already has the selected role (can't add it again)
    if (member.roles.cache.has(selectedRoleId)) {
      return interaction.reply({
        content: `❌ You already have the **${selected}** ranked role.`,
        ephemeral: true, 
      });
    }

    // Validate ownership via Steam API
    const response = await SteamController.checkGamesAddRole(steamId, selected);
    if (response?.error) {
      return interaction.reply({
        content: response.error,
        ephemeral: true, 
      });
    }

    // Add the selected role
    await member.roles.add(selectedRoleId);
    await interaction.reply({
      content: `✅ Role added successfully! You now have both **${selected}** and **${opposite}** ranked roles.`,
      ephemeral: true, 
    });

  } catch (error) {
    console.error('Error executing /addrankedrole:', error);
    await interaction.reply({
      content: '❌ An unexpected error occurred. Please try again later.',
      ephemeral: true, 
    });
  }
};