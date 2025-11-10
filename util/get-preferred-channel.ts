import { getOrCreateGuild } from '../db/db.ts';
import { getChannel } from '../discord/discord-client.ts';

export const getPreferredChannel = async (guildId: string) => {
    const preferredChannelId = (await getOrCreateGuild(guildId))?.preferredChannelId
    if (preferredChannelId === null) {
        console.error("Can't prompt discussion with no preferred channel. Run /init command")
        return
    }
    const channel = await getChannel(preferredChannelId)
    if (!channel.isSendable()) {
        console.error("Can't prompt discussion in a channel which isn't sendable. Run /init command in a better channel")
        return
    }

    return channel
}
