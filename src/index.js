require('dotenv').config()
const { Client, Intents } = require('discord.js')
const { skip, addToQueue, queue, clear, reset, shuffle } = require('./player')

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES ] })

client.once('ready', () => {
	console.log('Ready!')
})

client.on('messageCreate', async (message) => {
	if (message.content.includes('!play')) {
		await addToQueue(message)
	} else
	if (message.content.includes('!skip')) {
		await skip(message)
	} else
	if (message.content.includes('!queue')) {
		await queue(message)
	}
	if (message.content.includes('!clear')) {
		await clear(message)
	}
	if (message.content.includes('!reset')) {
		await clear(message)
	}
	if (message.content.includes('!shuffle')) {
		await shuffle(message)
	}
})

client.login(process.env.DISCORD_TOKEN)