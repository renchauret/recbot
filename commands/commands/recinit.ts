import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { initGuild } from '../../db/utils.ts'

export const recinit: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recinit')
        .setDescription('Sends a welcome message and sets this as the preferred channel.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        initGuild(interaction.guildId, interaction.channelId)
        await interaction.reply(`${interaction.user.displayName} initialized recbot in #${interaction.channel.name}`)
    }
}

