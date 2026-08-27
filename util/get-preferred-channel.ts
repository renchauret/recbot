import { getOrCreateGuild } from '../db/db.ts'
import { getChannel } from '../discord/discord-client.ts'

export const getPreferredChannel = async (guildId: string) => {
    const preferredChannelId = (await getOrCreateGuild(guildId))?.preferredChannelId
    if (!preferredChannelId) {
        console.error(`Can't send message in guild ${guildId} with no preferred channel. Run /init command`)
        return
    }
    const channel = await getChannel(preferredChannelId)
    if (!channel) {
        console.error(`Channel ${preferredChannelId} in guild ${guildId} could not be fetched. Run /init command in a channel that still exists`)
        return
    }
    if (!channel.isSendable()) {
        console.error(`Can't send message in channel ${preferredChannelId} in guild ${guildId} which isn't sendable. Run /init command in a better channel`)
        return
    }

    return channel
}
