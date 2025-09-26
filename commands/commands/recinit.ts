import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { createGuildOrUpdatePreferredChannel } from '../../db/db.ts'

export const recinit: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recinit')
        .setDescription('Sets this as the preferred channel for automated messages.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            await createGuildOrUpdatePreferredChannel(interaction.guildId, interaction.channelId)
        } catch (e) {
            console.error(`Failed to execute recinit command from user ${interaction.user.id} in guild ${interaction.guildId}: ${e}`)
        }
        try {
            await interaction.reply(`${interaction.user.displayName} initialized recbot in #${interaction.channel.name}`)
        } catch (e) {
            console.error(`Failed to respond to recinit interaction from user ${interaction.user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
