import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import type { Profile } from '../../models/profile.ts'
import { createProfileOrUpdateDisplayName, saveRecsToProfile } from '../../db/db.ts'

export const recswap: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recswap')
        .setDescription('Swaps two items in your rec queue.')
        .addNumberOption(option =>
            option.setName('index1')
                .setDescription('Enter the index of the first item to swap.')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('index2')
                .setDescription('Enter the index of the second item to swap.')
                .setRequired(true)
        ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const index1 = interaction.options.getNumber('index1')
        const index2 = interaction.options.getNumber('index2')
        const profile: Profile = await createProfileOrUpdateDisplayName(interaction.guildId, user.id, user.displayName)
        const rec1ToSwap = profile.recs[index1]
        const rec2ToSwap = profile.recs[index2]
        profile.recs[index1] = rec2ToSwap
        profile.recs[index2] = rec1ToSwap
        await saveRecsToProfile(interaction.guildId, profile.id, profile.recs)
        await interaction.reply(`${user.displayName} swapped recs <${rec1ToSwap}> and <${rec2ToSwap}>`)
    }
}
