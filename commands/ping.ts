import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import type { RecbotCommand } from './commands.js'

export const pingCommand: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply('Pong!');
    }
}
