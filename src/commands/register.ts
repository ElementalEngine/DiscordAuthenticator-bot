import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import { config } from '../config'

export const data = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Complete registration to gain access to the server.')

export const execute = async (interaction: ChatInputCommandInteraction) => {
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
  interaction.reply({
    content: `The CPL Bot needs authorization in order to search your Discord profile for your linked Steam account. It uses Steam accounts to verify unique users.\n\n[Click here to authorize](${config.oauth}${interaction.user.id})`,
    ephemeral: true,
  })
}
