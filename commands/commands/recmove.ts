import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import type { Profile } from '../../models/profile.ts'
import { createProfileOrUpdateDisplayName, saveRecsToProfile } from '../../db/db.ts'

export const recmove: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recmove')
        .setDescription('Moves one item in your rec queue to a new index.')
        .addNumberOption(option =>
            option.setName('origin')
                .setDescription('Enter the index of the item to move.')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('destination')
                .setDescription('Enter the index of to which to move the item.')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const originIndex = interaction.options.getNumber('origin')
        const destinationIndex = interaction.options.getNumber('destination')
        const profile: Profile = await createProfileOrUpdateDisplayName(interaction.guildId, user.id, user.displayName)
        const recToMove = profile.recs[originIndex]
        profile.recs.splice(destinationIndex, 0, profile.recs.splice(originIndex, 1)[0]);
        await saveRecsToProfile(interaction.guildId, profile.id, profile.recs)
        await interaction.reply(`${user.displayName} moved rec <${recToMove}> to index ${destinationIndex}`)
    }
}
