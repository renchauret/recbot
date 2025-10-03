import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { createGuildOrUpdatePreferredChannel } from '../../db/db.ts'

export const recinit: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recinit')
        .setDescription('Introduces recbot and sets the current channel as the destination for automated messages.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        try {
            await createGuildOrUpdatePreferredChannel(interaction.guildId, interaction.channelId)
        } catch (e) {
            console.error(`Failed to execute recinit command from user ${interaction.user.id} in guild ${interaction.guildId}: ${e}`)
        }
        const message = '# Welcome to Music Club!\nUse me to build your queue of recommended albums. '
            + "Every Friday at 9 PM, I'll pick the first album off of a random person's queue. "
            + 'Make time to listen to it during the next week. '
            + "The next Friday at 4 PM, I'll prompt a discussion about the album. "
            + 'Get started with **/rec** or learn more with **/rechelp**. '
            + 'Enjoy!'
        try {
            await interaction.reply(message)
        } catch (e) {
            console.error(`Failed to respond to recinit interaction from user ${interaction.user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
