import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'

export const recclear: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recclear')
        .setDescription('Deletes all items from your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => [])
        try {
            await interaction.reply(`${user.displayName} deleted all recs from their queue`)
        } catch (e) {
            console.error(`Failed to respond to recclear interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
