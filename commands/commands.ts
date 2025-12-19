import { SharedSlashCommand } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'
import { rechelp } from './commands/rechelp.ts'
import { rec } from './commands/rec.ts'
import { recq } from './commands/recq.ts'
import { recd } from './commands/recd.ts'
import { recswap } from './commands/recswap.ts'
import { recmove } from './commands/recmove.ts'
import { recclear } from './commands/recclear.ts'
import { recinit } from './commands/recinit.ts'
import {recdisable} from './commands/recdisable.ts'
import { recenable } from './commands/recenable.ts'

export type RecbotCommand = {
    data: SharedSlashCommand,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

// command name : command
export const commands: Map<string, RecbotCommand> = new Map([
    [rechelp.data.name, rechelp],
    [rec.data.name, rec],
    [recq.data.name, recq],
    [recmove.data.name, recmove],
    [recswap.data.name, recswap],
    [recd.data.name, recd],
    [recclear.data.name, recclear],
    [recinit.data.name, recinit],
    [recdisable.data.name, recdisable],
    [recenable.data.name, recenable]
])
