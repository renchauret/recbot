import { Client, Events, GatewayIntentBits, type Message, MessageFlags } from 'discord.js'
import { commands } from '../commands/commands.ts'
import { logger } from '../util/logger.ts'

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] })

export const initDiscordClient = () => {
    client.once(Events.ClientReady, readyClient => {
        logger.log(`Ready! Logged in as ${readyClient.user.tag}`)
    })

    client.on(Events.InteractionCreate, async interaction => {
        logger.log('interaction triggered')

        if (!interaction.isChatInputCommand()) return
        const command = commands.get(interaction.commandName);
        if (!command) {
            logger.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(error);
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
    client.on(Events.Error, error => logger.error(`Discord client error: ${error.stack ?? error}`))
    client.on(Events.ShardError, (error, shardId) => logger.error(`Shard ${shardId} error: ${error.stack ?? error}`))
    client.on(Events.ShardDisconnect, (event, shardId) =>
        logger.warn(`Shard ${shardId} disconnected (code ${event.code}), awaiting reconnect`))
    client.on(Events.ShardReconnecting, shardId => logger.log(`Shard ${shardId} reconnecting`))
    client.on(Events.ShardResume, (shardId, replayed) => logger.log(`Shard ${shardId} resumed, replayed ${replayed} events`))

    // The session can't be recovered from in-process; exit so the supervisor
    // starts us fresh.
    client.on(Events.Invalidated, () => {
        logger.error('Discord session invalidated, exiting')
        process.exit(1)
    })

    if (process.env.token) {
        loginWithRetry(process.env.token)
    } else {
        logger.log('Could not find token environment variable. Please supply it via command line using the --env-file flag.')
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
            logger.error('Discord rejected the token. Check the token environment variable.')
            process.exit(1)
        }

        const delayMs = Math.min(60_000, 2 ** attempt * 1_000)
        logger.error(`Discord login failed (attempt ${attempt + 1}), retrying in ${delayMs}ms: ${error}`)
        setTimeout(() => loginWithRetry(token, attempt + 1), delayMs)
    }
}

export const getChannel = async (channelId: string) => await client.channels.fetch(channelId)

/**
 * A message the bot posted earlier, or null if the channel is gone or can't hold
 * messages. Rejects the way discord.js does if the message itself is missing.
 */
export const fetchMessage = async (channelId: string, messageId: string): Promise<Message | null> => {
    const channel = await getChannel(channelId)
    if (!channel || !channel.isTextBased()) {
        return null
    }
    return await channel.messages.fetch(messageId)
}

/**
 * Runs a callback once the client is connected. Anything that needs to fetch
 * channels has to wait for this rather than running at startup.
 */
export const onClientReady = (callback: () => void | Promise<void>) => {
    client.once(Events.ClientReady, () => {
        void Promise.resolve(callback()).catch(e => logger.error(`Client ready callback failed: ${e}`))
    })
}
