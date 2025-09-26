import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { commands, type RecbotCommand } from '../commands.ts'

export const help: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists valid commands'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const intro = "I'm recbot. Use me to build a queue of recommendations. Each week, " +
            "I'll pick the first recommendation off of a random person's queue."
        const formattedCommands = commands.values().map(
            (command) => `${command.data.name}: ${command.data.description}`
        ).toArray().join('\n')
        await interaction.reply(`${intro}\nCommands:\n${formattedCommands}`);
    }
}
