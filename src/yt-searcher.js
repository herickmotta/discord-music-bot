const play = require('play-dl')

module.exports.yt = async (text) => {
    let songs
    text = text.trim()
    if (text.startsWith('http')) {
        if (play.yt_validate(text) === 'playlist') {
            songs = (await play.playlist_info(text, { incomplete : true })).videos
        } else
        if (play.yt_validate(text) === 'video') {
            const songInfo = await play.video_basic_info(text)
            songs = [{
                title: songInfo.video_details.title,
                url: songInfo.video_details.url
            }]
        }
    } else {
        const videos = await play.search(text, { source: { youtube: 'video' } })
        songs = [videos[0]]
    }
    return songs
}