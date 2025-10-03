import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'
import { formatRecs } from '../utils.ts'

export const recd: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recd')
        .setDescription('Deletes one item from your rec queue.')
        .addNumberOption(option =>
            option.setName('index')
                .setDescription('Enter the index of the rec to delete (first is 0).')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const indexToDelete = interaction.options.getNumber('index')
        let message: string
        try {
            const recs = await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => {
                if (indexToDelete >= recs.length || indexToDelete < 0) {
                    throw Error(`Invalid index ${indexToDelete}`)
                }
                recs.splice(indexToDelete, 1)
                return recs
            })
            message = `${user.displayName} deleted rec at index ${indexToDelete}\nNew rec queue:\n${formatRecs(recs)}`
        } catch (e) {
            console.error(`Failed to perform recd command for user ${user.id} in guild ${interaction.guildId}: ${e}`)
            message = 'An error occurred. Please try again.'
        }
        try {
            await interaction.reply(message)
        } catch (e) {
            console.error(`Failed to respond to recd interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
