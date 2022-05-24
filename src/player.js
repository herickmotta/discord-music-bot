const { stream } = require('play-dl')
const { yt } = require('./yt-searcher')
const {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    VoiceConnectionStatus
} = require('@discordjs/voice')
const { sort } = require('./utils/sort')

const guilds = {}

const checkForIdle = (guild) => {
    setTimeout( () => {
        if (guild?.player._state.status === 'idle') {
            guild?.player.stop()
            guild?.connection.destroy()
            guild = null
        }
    }, 60000)
}

const addToQueue = async (interaction) => {
    const { guildId } = interaction

    if (!guilds[guildId]) {
        guilds[guildId] = {
            voiceChannel: interaction.member.voice.channel,
            channel: interaction.channel,
            player: null,
            connection: null,
            queue: []
        }
    }

    const songs = await yt(interaction.content.replace('!play', ''))

    if (songs.length > 0) {
        songs.forEach(song => guilds[guildId].queue.push(song))

        const { player } = guilds[guildId]
        if (!player || player._state.status === 'idle') {
            play(guilds[guildId], songs[0])
        }
        return interaction.reply(
            `Added ${guilds[guildId].queue.length} songs to queue`
        )
    }

    return interaction.reply('No songs were found!')
}

const getNextMusic = (guild) => {
    guild.queue.shift()
    if (guild.queue.length === 0) return null
    return guild.queue[0]
}

const play = async (guild, song) => {
    if (!song) return
    const { voiceChannel } = guild

    if (!guild.player) {
        guild.player = createAudioPlayer()
        guild.player.on(AudioPlayerStatus.Idle, () => {
            play(guild, getNextMusic(guild))
            checkForIdle(guild)
        })
    }

    if (!guild.connection) {
        guild.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        })

        guild.connection.on(VoiceConnectionStatus.Disconnected, () => {
            guild.connection.destroy()
            guild.connection = null
        })

        guild.connection.on(VoiceConnectionStatus.Destroyed, () => {
            guild.connection = null
        })

        guild.connection.subscribe(guild.player)
    }

    guild.channel.send('Playing: ' + song.title)
    const source = await stream(song.url)
    const resource = createAudioResource(source.stream, { inputType: source.type })
    guild.player.play(resource)
}

const skip = (message) => {
    const { guildId } = message
    const guild = guilds[guildId]
    if (!guild) return
    if (guild.queue.length === 0) {
        guild.player.stop()
        guild.player = null
    } else {
        play(guild, getNextMusic(guild))
    }

    return message.reply('Skip')
}

const queue = (message) => {
    const { guildId } = message
    const guild = guilds[guildId]
    if(!guild) return

    return message.reply(
        `Queue:
         ${guild.queue.map((song, index) => `${index + 1}. ${song.title}`).join('\n')}`
    )
}

const clear = (message) => {
    const { guildId } = message
    const guild = guilds[guildId]
    if(!guild) return

    guild?.player.stop()
    guild.player = null

    guild.queue = []
    return message.reply('Queue cleared')
}

const reset = async (message) => {
    const { guildId } = message
    const guild = guilds[guildId]
    if(!guild) return

    guild.player.stop()
    guild.player = null
    guild.connection.destroy()
    guild.connection = null
    guild = null

    return message.reply('Reset')
}

const shuffle = async (message) => {
    const { guildId } = message
    const guild = guilds[guildId]

    guild.queue = await sort(guild.queue)

    return message.reply('Queue shuffled')
}

module.exports = {
    play,
    addToQueue,
    skip,
    queue,
    clear,
    reset,
    shuffle
}