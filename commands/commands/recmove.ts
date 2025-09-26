import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import {modifyRecs } from '../../db/db.ts'

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
        await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => {
            recs.splice(destinationIndex, 0, recs.splice(originIndex, 1)[0]);
            return recs
        })
        try {
            await interaction.reply(`${user.displayName} moved rec at index ${originIndex} to index ${destinationIndex}`)
        } catch (e) {
            console.error(`Failed to respond to recmove interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
