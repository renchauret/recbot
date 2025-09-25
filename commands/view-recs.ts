import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import fs from 'fs'
import type { RecbotCommand } from './commands.js'
import type { Profile } from '../models/profile.js'

export const viewRecCommand: RecbotCommand = {
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
        const filePath = `../db/${interaction.guildId}/${user.id}.json`

        const profile: Profile = (fs.existsSync(filePath)) ?
            (JSON.parse(fs.readFileSync(filePath, 'utf8')))
        : {
            id: user.id,
            displayName: user.displayName,
            recs: [],
            timesRecPicked: 0,
            lastRecPickedDate: null
        }
        profile.recs.push(recommendation)
        // update user's displayName in case they've changed it
        profile.displayName = user.displayName
        fs.writeFileSync(filePath, JSON.stringify(profile), 'utf8')

        await interaction.reply(`${user.displayName} recommended ${recommendation}`)
    }
}

