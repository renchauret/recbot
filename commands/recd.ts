import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from './commands.ts'
import type { Profile } from '../models/profile.ts'
import { getOrCreateProfile } from '../db/utils.ts'

export const recd: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recd')
        .setDescription('Shows you your rec queue.')
        .addNumberOption(option =>
            option.setName('index')
                .setDescription('Enter the index of the rec to delete (first is 0).')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const indexToDelete = interaction.options.getNumber('index')
        const profile: Profile = getOrCreateProfile(interaction.guildId, user.id, user.displayName)
        const recToDelete = profile.recs[indexToDelete]
        profile.recs = profile.recs.splice(indexToDelete, 1)
        await interaction.reply(`${user.displayName} deleted rec ${recToDelete}`)
    }
}
