import { SlashCommandBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'
import { pingCommand } from './ping.ts'
import { recCommand } from './rec.ts'

export type RecbotCommand = {
    data: SlashCommandBuilder,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

// command name : command
export const commands: Map<string, RecbotCommand> = new Map([
    [pingCommand.data.name, pingCommand],
    [recCommand.data.name, recCommand]
])
