import { SharedSlashCommand } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'
import { help } from './commands/help.ts'
import { rec } from './commands/rec.ts'
import { recq } from './commands/recq.ts'
import { recd } from './commands/recd.ts'
import { recswap } from './commands/recswap.ts'
import { recmove } from './commands/recmove.ts'
import { recclear } from './commands/recclear.ts'
import { recinit } from './commands/recinit.ts'

export type RecbotCommand = {
    data: SharedSlashCommand,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

// command name : command
export const commands: Map<string, RecbotCommand> = new Map([
    [help.data.name, help],
    [rec.data.name, rec],
    [recd.data.name, recd],
    [recq.data.name, recq],
    [recswap.data.name, recswap],
    [recclear.data.name, recclear],
    [recmove.data.name, recmove],
    [recinit.data.name, recinit]
])
