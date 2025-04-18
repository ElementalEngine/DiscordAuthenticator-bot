// src/commands/addRankedRole.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  GuildMember,
  PermissionFlagsBits
} from 'discord.js';
import { config } from '../config/index.js';
import { SteamService } from '../services/steam.service.js';
import { findPlayerByDiscordId } from '../database/queries.js';

export const data = new SlashCommandBuilder()
  .setName('addrankedrole')
  .setDescription('Add Civ6 or Civ7 ranked role if you own the game on Steam.')
  .addStringOption(opt =>
    opt
      .setName('game')
      .setDescription('Which Civ game role to add?')
      .setRequired(true)
      .addChoices(
        { name: 'Civilization VI', value: 'Civ6' },
        { name: 'Civilization VII', value: 'Civ7' }
      )
  );

type SelectedGame = 'Civ6' | 'Civ7';

export const execute = async (
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });

  const civ6Chan = process.env.CHANNEL_COMMANDS_CIV6_ID;
  const civ7Chan = process.env.CHANNEL_COMMANDS_CIV7_ID;
  if (!civ6Chan || !civ7Chan) {
    await interaction.editReply({
      content: '❌ Bot misconfiguration: missing command channel IDs.'
    });
    return;
  }
  if (![civ6Chan, civ7Chan].includes(interaction.channelId)) {
    await interaction.editReply({
      content:
        '❌ This command only works in the designated Civ6/Civ7 channels.'
    });
    return;
  }

  const selected = interaction.options.getString('game', true) as SelectedGame;
  const discordId = interaction.user.id;

  const user = await findPlayerByDiscordId(discordId);
  if (!user) {
    await interaction.editReply({
      content: '❌ Discord ID not found—please register first.'
    });
    return;
  }
  if (!user.steam_id) {
    await interaction.editReply({
      content: '❌ No Steam linked—authorize your Steam account first.'
    });
    return;
  }

  if (
    !interaction.guild?.members.me?.permissions.has(
      PermissionFlagsBits.ManageRoles
    )
  ) {
    await interaction.editReply({
      content: '❌ Missing Manage Roles permission.'
    });
    return;
  }

  const member = interaction.guild.members.cache.get(
    discordId
  ) as GuildMember;
  if (!member) {
    await interaction.editReply({
      content: '❌ Could not fetch your guild member data.'
    });
    return;
  }

  // Must already have a ranked role to switch/add
  const ranked = [
    config.discord.roles.Civ6Rank,
    config.discord.roles.Civ7Rank
  ];
  if (!ranked.some(r => member.roles.cache.has(r))) {
    await interaction.editReply({
      content:
        '❌ You need an existing Civ rank to use this command (e.g., registered with playtime).'
    });
    return;
  }

  const targetRole = config.discord.roles[`${selected}Rank`];
  if (member.roles.cache.has(targetRole)) {
    await interaction.editReply({
      content: `❌ You already have the ${selected} rank.`
    });
    return;
  }

  const check = await SteamService.checkGamesAddRole(
    user.steam_id,
    selected
  );
  if (check.error) {
    await interaction.editReply({ content: check.error });
    return;
  }

  await member.roles.add(targetRole);
  await interaction.editReply({
    content: `✅ ${selected} rank added successfully!`
  });
};
