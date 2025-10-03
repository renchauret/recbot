import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'
import { formatRecs } from '../utils.ts'

export const recclear: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recclear')
        .setDescription('Deletes all items from your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const recs = await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => [])
        try {
            await interaction.reply(`${user.displayName} deleted all recs from their queue\nNew rec queue:\n${formatRecs(recs)}`)
        } catch (e) {
            console.error(`Failed to respond to recclear interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
