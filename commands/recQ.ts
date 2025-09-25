import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import fs from 'fs'
import type { RecbotCommand } from './commands.js'
import type { Profile } from '../models/profile.js'

export const recQ: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('recQ')
        .setDescription('Shows you your rec queue.'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        const user = interaction.user
        const fileDir = `../db/${interaction.guildId}`
        const filePath = `${fileDir}/${user.id}.json`

        const profile: Profile = (fs.existsSync(filePath)) ?
            (JSON.parse(fs.readFileSync(filePath, 'utf8')))
        : {
            id: user.id,
            displayName: user.displayName,
            recs: [],
            timesRecPicked: 0,
            lastRecPickedDate: null
        }
        // update user's displayName in case they've changed it
        profile.displayName = user.displayName
        if (!fs.existsSync(fileDir)){
            fs.mkdirSync(fileDir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(profile), 'utf8')

        await interaction.reply(`${user.displayName}'s rec queue: ${profile.recs}`)
    }
}

