import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { config } from '../config'

export const data = new SlashCommandBuilder()
  .setName('AddCiv7Role')
  .setDescription('Add Civ7 role to existing user.')