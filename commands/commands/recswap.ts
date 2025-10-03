import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'
import { formatRecs } from '../utils.ts'

export const recswap: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recswap')
        .setDescription('Swaps two items in your rec queue.')
        .addNumberOption(option =>
            option.setName('index1')
                .setDescription('Enter the index of the first item to swap.')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('index2')
                .setDescription('Enter the index of the second item to swap.')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const index1 = interaction.options.getNumber('index1')
        const index2 = interaction.options.getNumber('index2')
        let message: string
        try {
            const recs = await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => {
                const rec1ToSwap = recs[index1]
                recs[index1] = recs[index2]
                recs[index2] = rec1ToSwap
                return recs
            })
            message = `${user.displayName} swapped recs at indices ${index1} and ${index2}\nNew rec queue:\n${formatRecs(recs)}`
        } catch (e) {
            console.error(`Failed to perform recswap command for user ${user.id} in guild ${interaction.guildId}: ${e}`)
            message = 'An error occurred. Please try again.'
        }
        try {
            await interaction.reply(message)
        } catch (e) {
            console.error(`Failed to respond to recswap interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
