import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { config } from '../config'

export const data = new SlashCommandBuilder()
  .setName('AddRankedRole')
  .setDescription('Add Civ7 or Civ6 role to existing user.')