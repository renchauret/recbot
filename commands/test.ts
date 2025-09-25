import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from './commands.ts'
import type { Profile } from '../models/profile.ts'
import { getAllProfiles, getOrCreateProfile, saveProfile } from '../db/utils.ts'

export const test: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('temp'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const profiles = getAllProfiles(interaction.guildId)
        console.log(profiles)
        await interaction.reply('done')
    }
}

