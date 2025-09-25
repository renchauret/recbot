import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import type { Profile } from '../../models/profile.ts'
import { getOrCreateProfile, saveProfile } from '../../db/utils.ts'

export const recclear: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recclear')
        .setDescription('Deletes all items from your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const profile: Profile = getOrCreateProfile(interaction.guildId, user.id, user.displayName)
        profile.recs = []
        saveProfile(interaction.guildId, profile)
        await interaction.reply(`${user.displayName} deleted all recs from their queue`)
    }
}
