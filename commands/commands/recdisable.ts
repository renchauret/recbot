import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { setProfileDisabled } from '../../db/db.ts'

export const recdisable: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recdisable')
        .setDescription('Disables your recommendations from being picked.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        let message: string
        try {
            await setProfileDisabled(interaction.guildId, user.id, true)
            message = `${user.displayName} disabled their rec queue.`
        } catch (e) {
            console.error(`Failed to perform recdisable command for user ${user.id} in guild ${interaction.guildId}: ${e}`)
            message = 'An error occurred. Please try again.'
        }
        try {
            await interaction.reply(message)
        } catch (e) {
            console.error(`Failed to respond to recdisable interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
