import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import type { Profile } from '../../models/profile.ts'
import { createProfileOrUpdateDisplayName, saveRecsToProfile } from '../../db/db.ts'

export const recd: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recd')
        .setDescription('Deletes one item from your rec queue.')
        .addNumberOption(option =>
            option.setName('index')
                .setDescription('Enter the index of the rec to delete (first is 0).')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const indexToDelete = interaction.options.getNumber('index')
        const profile: Profile = await createProfileOrUpdateDisplayName(interaction.guildId, user.id, user.displayName)
        const recToDelete = profile.recs[indexToDelete]
        profile.recs.splice(indexToDelete, 1)
        await saveRecsToProfile(interaction.guildId, profile.id, profile.recs)
        await interaction.reply(`${user.displayName} deleted rec <${recToDelete}>`)
    }
}
