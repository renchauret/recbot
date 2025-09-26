import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { modifyRecs } from '../../db/db.ts'

export const rec: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('rec')
        .setDescription('Adds the following string to your recommendation queue.')
        .addStringOption(option =>
            option.setName('recommendation')
                .setDescription('Enter the name of or link to your recommendation.')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const recommendation = interaction.options.getString('recommendation')
        await modifyRecs(interaction.guildId, user.id, user.displayName, (recs: string[]) => {
            recs.push(recommendation)
            return recs
        })
        try {
            await interaction.reply(`${user.displayName} recommended <${recommendation}>`)
        } catch (e) {
            console.error(`Failed to respond to rec interaction from user ${user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
