import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import type { Profile } from '../../models/profile.ts'
import { getOrCreateProfile } from '../../db/utils.ts'

export const recq: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recq')
        .setDescription('Shows you your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const profile: Profile = getOrCreateProfile(interaction.guildId, user.id, user.displayName)
        const formattedRecs = profile.recs.map(((rec, index) => `${index}: ${rec}`)).join('\n')
        await interaction.reply(`${user.displayName}'s rec queue:\n${formattedRecs}`)
    }
}
