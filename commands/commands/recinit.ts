import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { createGuildOrUpdatePreferredChannel } from '../../db/db.ts'

export const recinit: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recinit')
        .setDescription('Sets this as the preferred channel for automated messages.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await createGuildOrUpdatePreferredChannel(interaction.guildId, interaction.channelId)
        await interaction.reply(`${interaction.user.displayName} initialized recbot in #${interaction.channel.name}`)
    }
}

