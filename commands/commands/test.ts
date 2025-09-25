import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import type { RecbotCommand } from '../commands.ts'
import type { Profile } from '../../models/profile.ts'
import { getAllProfiles, getOrCreateProfile, saveProfile } from '../../db/utils.ts'
import { randomInt } from 'node:crypto'

export const test: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('temp'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const profiles = getAllProfiles(interaction.guildId)
        const pickedProfile = profiles[randomInt(0, profiles.length)]
        const pickedRec= pickedProfile.recs.splice(0, 1)[0]
        pickedProfile.pickedRecs.push({
            name: pickedRec,
            pickedDate: Date.now()
        })
        saveProfile(interaction.guildId, pickedProfile)
        await interaction.reply(`Our new recommendation is ${pickedRec} from ${pickedProfile.displayName}!`)
    }
}

