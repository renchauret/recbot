import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import fs from 'fs'
import type { RecbotCommand } from './commands.js'
import type { Profile } from '../models/profile.js'
import { getOrCreateProfile } from '../db/utils.js'

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

