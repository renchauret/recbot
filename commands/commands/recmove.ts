import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'
import { formatRecs } from '../utils.ts'

export const recmove: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recmove')
        .setDescription('Moves one item in your rec queue to a new index.')
        .addNumberOption(option =>
            option.setName('origin')
                .setDescription('Enter the index of the item to move.')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('destination')
                .setDescription('Enter the index of to which to move the item.')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const originIndex = interaction.options.getNumber('origin')
        const destinationIndex = interaction.options.getNumber('destination')
        let message: string
        try {
            const recs = await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => {
                if (originIndex >= recs.length || originIndex < 0) {
                    throw Error(`Invalid index ${originIndex}`)
                }
                if (destinationIndex >= recs.length || destinationIndex < 0) {
                    throw Error(`Invalid index ${destinationIndex}`)
                }
                recs.splice(destinationIndex, 0, recs.splice(originIndex, 1)[0]);
                return recs
            })
            message = `${user.displayName} moved rec at index ${originIndex} to index ${destinationIndex}\n### New rec queue:\n${formatRecs(recs)}`
        } catch (e) {
            console.error(`Failed to perform recmove command for user ${user.id} in guild ${interaction.guildId}: ${e}`)
            message = 'An error occurred. Please try again.'
        }
        try {
            await interaction.reply(message)
        } catch (e) {
            console.error(`Failed to respond to recmove interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
