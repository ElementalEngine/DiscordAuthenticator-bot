import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMemberRoleManager } from 'discord.js';
import { config } from '../config';
import { Player } from '../database/players';

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

  if (interaction.channelId !== process.env.CHANNEL_WELCOME) {
    return await interaction.reply({
      content: `This command can only be used in <#${process.env.CHANNEL_WELCOME}>`,
      ephemeral: true,
    });
  }

  const hasNonVerifiedRole = interaction.member?.roles instanceof GuildMemberRoleManager 
    && interaction.member.roles.cache.has(process.env.ROLE_NON_VERIFIED!);

  if (!hasNonVerifiedRole) {
    return await interaction.reply({
      content: '❌ You do not have the required role to use this command. Only non-verified users can run this.',
      ephemeral: true,
    });
  }

  // Check if the user is already registered
  const exist = await Player.findOne({ discord_id: interaction.user.id });
  if (exist) {
    return await interaction.reply({
      content: `You are already registered.`,
      ephemeral: true,
    });
  }

  if (type === 'epic') {
    return await interaction.reply({
      content: `Epic account registration is not available yet. Please contact a moderator.`,
      ephemeral: true,
    });
  }

  // Generate OAuth link
  const state = encodeURI(`${game.toLowerCase()}|${interaction.user.id}`);
  interaction.reply({
    content: `The CPL Bot needs authorization to verify your linked Steam account.\n\n[Click here to authorize](${config.oauth}${state})`,
    ephemeral: true,
  });
};
