import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { createGuildOrUpdatePreferredChannel } from '../../db/db.js'

export const recinit: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recinit')
        .setDescription('Sends a welcome message and sets this as the preferred channel.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await createGuildOrUpdatePreferredChannel(interaction.guildId, interaction.channelId)
        await interaction.reply(`${interaction.user.displayName} initialized recbot in #${interaction.channel.name}`)
    }
}

