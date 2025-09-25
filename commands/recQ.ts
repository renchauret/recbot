import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from './commands.ts'
import type { Profile } from '../models/profile.ts'
import { getOrCreateProfile } from '../db/utils.ts'

export const recQ: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recQ')
        .setDescription('Shows you your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const profile: Profile = getOrCreateProfile(interaction.guildId, user.id, user.displayName)
        await interaction.reply(`${user.displayName}'s rec queue: ${profile.recs}`)
    }
}

