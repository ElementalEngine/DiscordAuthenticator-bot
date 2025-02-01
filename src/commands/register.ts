import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { config } from '../config'
import { Player } from '../database/players'

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Complete registration to gain access to the server.')
  .addStringOption((option) =>
    option
      .setName('account_type')
      .setDescription('Select the type of account you are registering.')
      .setRequired(true)
      .addChoices(
        { name: 'Epic', value: 'epic' },
        { name: 'Steam', value: 'steam' }
      )
  )
  .addStringOption((option) =>
    option
      .setName('game')
      .setDescription('Select the Civilization game you are playing.')
      .setRequired(true)
      .addChoices(
        { name: 'Civilization VI', value: 'Civ6' },
        { name: 'Civilization VII', value: 'Civ7' }
      )
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const type = interaction.options.getString('account_type') || 'steam';
  const game = interaction.options.getString('game') || 'Civ6';
  if (interaction.channelId !== config.discord.channels.welcome)
    return await interaction.reply({
      content: `This command can only be used in <#${config.discord.channels.welcome}>`,
      ephemeral: true,
    })
  if (
    (interaction as any).member.roles.cache.some(
      (role: any) => role.id === config.discord.roles.member
    )
  )
    return await interaction.reply({
      content: `You are already registered.`,
      ephemeral: true,
    })

  const exist = await Player.findOne({ discordId: interaction.user.id })
  console.log({ exist })
  if (exist) {
    return await interaction.reply({
      content: `You are already registered.`,
      ephemeral: true,
    })
  }
  if (type === 'epic') {
    return await interaction.reply({
      content: `Epic account registration is not available yet. Please contact a moderator for assistance.`,
      ephemeral: true,
    })
  
  }
  const state = encodeURI(`${game.toLocaleLowerCase()}|${interaction.user.id}`)

  interaction.reply({
    content: `The CPL Bot needs authorization in order to search your Discord profile for your linked Steam account. It uses Steam accounts to verify unique users.\n\n[Click here to authorize](${config.oauth}${state})`,
    ephemeral: true,
  })
}
