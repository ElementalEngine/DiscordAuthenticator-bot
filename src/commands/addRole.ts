import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { config } from '../config'
import { SteamController } from '../controllers/steam'
import { Player } from '../database/players'

export const data = new SlashCommandBuilder()
  .setName('addrankedrole')
  .setDescription('Add Civ7 or Civ6 role to existing user.')
  .addStringOption((option) =>
    option
      .setName('game')
      .setDescription('Select the Civilization game you are chossing to add.')
      .setRequired(true)
      .addChoices(
        { name: 'Civilization VI', value: 'Civ6' },
        { name: 'Civilization VII', value: 'Civ7' }
      )
  );

  type Selected = 'Civ6' | 'Civ7'
  export const execute = async (interaction: ChatInputCommandInteraction) => {
    const selected: Selected = interaction.options.getString('game') as Selected ?? 'Civ6'
    const negated: Selected = selected === 'Civ6' ? 'Civ7' : 'Civ6'
    const selectedGame = config.steam[selected === 'Civ6' ? 'gameId' : 'gameIdCiv7']

    //  Check if user already has the role
    if ((interaction as any).member.roles.cache.some(
      (role: any) => role.id === config.discord.roles[`${negated}Rank`]
    )) {
      //  Get player from database
      const player = await Player.findOne({ discordId: interaction.user.id })
      //  Validate user has the game on steam
      const response = await SteamController.validate(player?.steam_id, selectedGame)
      if (response?.success) {
        //  Add role to user
        await (interaction as any).member.roles.add(config.discord.roles[`${selected}Rank`])
        await interaction.reply({
          content: `Role added successfully. You now have the ${selected} role.`,
          ephemeral: true
        })
      } else {
        //  Send error message
        await interaction.reply({
          content: 'You do not own the game on steam.',
          ephemeral: true
        })
      }
    }
  }