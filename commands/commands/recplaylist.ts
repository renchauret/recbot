import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import { setPlaylistId } from '../../db/db.ts'
import { fetchPlaylistName } from '../../spotify/playlist.ts'
import { getSpotifyClient } from '../../spotify/spotify-client.ts'
import { parsePlaylistId, playlistUrl } from '../../spotify/spotify-urls.ts'

export const recplaylist: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recplaylist')
        .setDescription('Sets the Spotify playlist that weekly winning tracks are added to.')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('Enter a link to the Spotify playlist.')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const input = interaction.options.getString('playlist')
        const playlistId = parsePlaylistId(input)
        let message: string

        if (!playlistId) {
            message = `<${input}> doesn't look like a Spotify playlist link. Copy one with Share > Copy link to playlist.`
        } else {
            try {
                await setPlaylistId(interaction.guildId, playlistId)
                const name = await fetchPlaylistName(getSpotifyClient(), playlistId)
                message = `Winning tracks will be added to ${name ? `**${name}**` : 'the playlist'}: `
                    + `<${playlistUrl(playlistId)}>`
            } catch (e) {
                console.error(`Failed to set playlist for guild ${interaction.guildId}: ${e}`)
                message = 'An error occurred. Please try again.'
            }
        }

        try {
            await interaction.reply(message)
        } catch (e) {
            console.error(`Failed to respond to recplaylist interaction from user ${interaction.user.id} in guild ${interaction.guildId}: ${e}`)
        }
    }
}
