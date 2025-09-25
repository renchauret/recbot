import { SharedSlashCommand } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'
import { ping } from './ping.ts'
import { rec } from './rec.ts'
import { recQ } from './recQ.ts'

export type RecbotCommand = {
    data: SharedSlashCommand,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

// command name : command
export const commands: Map<string, RecbotCommand> = new Map([
    [ping.data.name, ping],
    [rec.data.name, rec],
    [recQ.data.name, recQ]
])
