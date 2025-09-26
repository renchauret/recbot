import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import type { Profile } from '../../models/profile.ts'
import { createProfileOrUpdateDisplayName, saveRecsToProfile } from '../../db/db.ts'

export const recclear: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recclear')
        .setDescription('Deletes all items from your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const profile: Profile = await createProfileOrUpdateDisplayName(interaction.guildId, user.id, user.displayName)
        profile.recs = []
        await saveRecsToProfile(interaction.guildId, profile.id, profile.recs)
        await interaction.reply(`${user.displayName} deleted all recs from their queue`)
    }
}
