import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { configDotenv } from 'dotenv'
import { commands } from './commands/commands.ts'

configDotenv()
const rest = new REST().setToken(process.env.token)
const deployCommands = async () => {
    const jsonCommands =
        commands.values().map(command => command.data.toJSON()).toArray()
    try {
        console.log(`Started refreshing ${jsonCommands.length} application (/) commands.`)

        // The put method is used to fully refresh all commands in all guilds this bot is in
        await rest.put(
            Routes.applicationCommands(process.env.clientId),
            { body: jsonCommands },
        )

        console.log(`Successfully reloaded ${jsonCommands.length} application (/) commands.`)
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error)
    }
}
deployCommands()
