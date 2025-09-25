import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from './commands.js'
import type { Profile } from '../models/profile.js'
import { getOrCreateProfile } from '../db/utils.js'

export const rec: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('rec')
        .setDescription('Adds the following string to your recommendation queue.')
        .addStringOption(option =>
            option.setName('recommendation')
                .setDescription('Enter the name of or link to your recommendation.')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const recommendation = interaction.options.getString('recommendation')
        const profile: Profile = getOrCreateProfile(interaction.guildId, user.id, user.displayName)
        profile.recs.push(recommendation)
        await interaction.reply(`${user.displayName} recommended ${recommendation}`)
    }
}

