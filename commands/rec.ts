import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../index.ts'

export const recCommand: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('rec')
        .setDescription('Adds the following string to your recommendation queue.'),
        // .addStringOption(option =>
        //     option.setName('link')
        //         .setDescription('Enter the link to your recommendation.')
        //         .setRequired(true)
        // ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply('Pong!');
    }
}
