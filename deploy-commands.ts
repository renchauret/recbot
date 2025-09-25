import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { configDotenv } from 'dotenv'
import { pingCommand } from './commands/ping.ts'
import { recCommand } from './commands/rec.ts'

const commands = [
    pingCommand.data.toJSON(),
    recCommand.data.toJSON()
]

configDotenv()
const rest = new REST().setToken(process.env.token)
const deployCommands = async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`)

        // The put method is used to fully refresh all commands in all guilds this bot is in
        await rest.put(
            Routes.applicationCommands(process.env.clientId),
            { body: commands },
        )

        console.log(`Successfully reloaded ${commands.length} application (/) commands.`)
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error)
    }
}
deployCommands()
