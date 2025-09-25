import { ChatInputCommandInteraction, Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js'
import { configDotenv } from 'dotenv'
import { SlashCommandBuilder } from '@discordjs/builders'
import { pingCommand } from './commands/ping.ts'
import { recCommand } from './commands/rec.ts'

export type RecbotCommand = {
    data: SlashCommandBuilder,
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

class RecbotClient extends Client {
    // command name : command
    commands: Map<string, RecbotCommand>
}

const client = new RecbotClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] })

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`)
})

client.on(Events.InteractionCreate, async interaction => {
    console.log('interaction triggered')

    if (!interaction.isChatInputCommand()) return
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
        }
    }

    // if (commandName === 'rec') {
        // const text = interaction.options.getString('link')

        // TODO:  save rec to queue

        // fs.writeFile('media/' + videoCount + '-tts.txt', text, function (err) {
        //     if (err) return console.log(err)
        //     console.log("Couldn't write TTS file.")
        // })

        // await interaction.reply('test')
    // }
})

client.on('messageCreate', receivedMessage => {
    console.log(`received message`)

    // Prevent bot from responding to its own messages
    if (receivedMessage.author == client.user) {
        return
    }

    // Check for messages sent to bot (@<botname>)
    if (receivedMessage.content.includes(client.user.id.toString())) {
        receivedMessage.channel.send("Message received from " + receivedMessage.author.toString() + ": " + receivedMessage.content)
    }
})

client.commands = new Map()
client.commands.set(pingCommand.data.name, pingCommand)
client.commands.set(recCommand.data.name, recCommand)

configDotenv()
if (process.env.token) {
    client.login(process.env.token)
} else {
    console.log('Could not find token environment variable. Please supply it via command line using the --env-file flag.')
}