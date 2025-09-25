import { SharedSlashCommand } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'
import { ping } from './ping.ts'
import { rec } from './rec.ts'
import { recq } from './recq.ts'
import { recd } from './recd.ts'
import { recswap } from './recswap.ts'
import { recmove } from './recmove.ts'

export type RecbotCommand = {
    data: SharedSlashCommand,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

// command name : command
export const commands: Map<string, RecbotCommand> = new Map([
    [ping.data.name, ping],
    [rec.data.name, rec],
    [recd.data.name, recd],
    [recq.data.name, recq],
    [recswap.data.name, recswap],
    [recmove.data.name, recmove]
])
