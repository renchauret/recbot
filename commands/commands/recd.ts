import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'

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
        await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => {
            recs.splice(indexToDelete, 1)
            return recs
        })
        await interaction.reply(`${user.displayName} deleted rec at index ${indexToDelete}`)
    }
}
