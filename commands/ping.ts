import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import type { RecbotCommand } from './commands.js'

export const ping: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply('Pong!');
    }
}
