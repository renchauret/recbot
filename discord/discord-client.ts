import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js'
import { commands } from '../commands/commands.ts'

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
        // client.user is null until the client is ready
        if (!client.user) {
            return
        }

        // Prevent bot from responding to its own messages
        if (receivedMessage.author == client.user) {
            return
        }

        // Check for messages sent to bot (@<botname>)
        if (receivedMessage.content.includes(client.user.id.toString())) {
            receivedMessage.channel.send("Message received from " + receivedMessage.author.toString() + ": " + receivedMessage.content)
        }
    })

    // An EventEmitter that emits 'error' with no listener attached throws, which
    // took the whole process down whenever the gateway connection dropped.
    // discord.js reconnects on its own, so these only need to be logged.
    client.on(Events.Error, error => console.error(`Discord client error: ${error.stack ?? error}`))
    client.on(Events.ShardError, (error, shardId) => console.error(`Shard ${shardId} error: ${error.stack ?? error}`))
    client.on(Events.ShardDisconnect, (event, shardId) =>
        console.warn(`Shard ${shardId} disconnected (code ${event.code}), awaiting reconnect`))
    client.on(Events.ShardReconnecting, shardId => console.log(`Shard ${shardId} reconnecting`))
    client.on(Events.ShardResume, (shardId, replayed) => console.log(`Shard ${shardId} resumed, replayed ${replayed} events`))

    // The session can't be recovered from in-process; exit so the supervisor
    // starts us fresh.
    client.on(Events.Invalidated, () => {
        console.error('Discord session invalidated, exiting')
        process.exit(1)
    })

    if (process.env.token) {
        loginWithRetry(process.env.token)
    } else {
        console.log('Could not find token environment variable. Please supply it via command line using the --env-file flag.')
    }
}

// The Pi routinely finishes booting before the network is up, and a failed
// login rejects rather than retrying. Back off up to a minute and keep trying
// so a slow WiFi association doesn't leave the bot down until someone notices.
const loginWithRetry = async (token: string, attempt = 0): Promise<void> => {
    try {
        await client.login(token)
    } catch (error) {
        // A rejected token is a config problem, not a blip. Retrying would hide
        // it forever, so fail loudly instead.
        if ((error as { code?: string })?.code === 'TokenInvalid') {
            console.error('Discord rejected the token. Check the token environment variable.')
            process.exit(1)
        }

        const delayMs = Math.min(60_000, 2 ** attempt * 1_000)
        console.error(`Discord login failed (attempt ${attempt + 1}), retrying in ${delayMs}ms: ${error}`)
        setTimeout(() => loginWithRetry(token, attempt + 1), delayMs)
    }
}

export const getChannel = async (channelId: string) => await client.channels.fetch(channelId)
