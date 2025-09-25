import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

import type { RecbotCommand } from './commands.js'

export const recCommand: RecbotCommand = {
    data: new SlashCommandBuilder()
        .setName('rec')
        .setDescription('Adds the following string to your recommendation queue.'),
        // .addStringOption(option =>
        //     option.setName('link')
        //         .setDescription('Enter the link to your recommendation.')
        //         .setRequired(true)
        // ),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.reply('Pong!');
        // const text = interaction.options.getString('link')

        // TODO:  save rec to queue

        // fs.writeFile('media/' + videoCount + '-tts.txt', text, function (err) {
        //     if (err) return console.log(err)
        //     console.log("Couldn't write TTS file.")
        // })

        // await interaction.reply('test')
    }
}
