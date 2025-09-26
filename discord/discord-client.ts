import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js'
import { commands } from '../commands/commands.js'

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] })

export const initDiscordClient = () => {
    client.once(Events.ClientReady, readyClient => {
        console.log(`Ready! Logged in as ${readyClient.user.tag}`)
    })

    client.on(Events.InteractionCreate, async interaction => {
        console.log('interaction triggered')

        if (!interaction.isChatInputCommand()) return
        const command = commands.get(interaction.commandName);
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

    if (process.env.token) {
        client.login(process.env.token)
    } else {
        console.log('Could not find token environment variable. Please supply it via command line using the --env-file flag.')
    }
}

export const getChannel = async (channelId: string) => await client.channels.fetch(channelId)
