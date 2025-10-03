import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'
import { formatRecs } from '../utils.ts'

export const recq: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recq')
        .setDescription('Shows you your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const recs = await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => recs)
        try {
            await interaction.reply(`${user.displayName}'s rec queue:\n${formatRecs(recs)}`)
        } catch (e) {
            console.error(`Failed to respond to recq interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
