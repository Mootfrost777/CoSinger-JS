const Discord = require('discord.js');
const { joinVoiceChannel, AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource,
    generateDependencyReport
} = require('@discordjs/voice');
const {
    prefix,
    token,
} = require('./config.json')
const ytdl = require('ytdl-core')
const ytSearch = require('yt-search');

const bot = new Discord.Client(
    { intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, 'GUILD_VOICE_STATES'] }
);

const queue = new Map();

bot.once('ready', () => {
    console.log('Ready!');
});
bot.once('reconnecting', () => {
    console.log('Reconnecting!');
});
bot.once('disconnect', () => {
    console.log('Disconnect!');
});

bot.on('message', async message =>
{
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id)

    if (message.content.startsWith(`${prefix}play`))
    {
        await execute(message, serverQueue);
    }
    else if (message.content.startsWith(`${prefix}skip`))
    {
        await skip(message, serverQueue);
    }
    else if (message.content.startsWith(`${prefix}stop`))
    {
        await stop(message, serverQueue);
    }
    else
    {
        return message.channel.send('Invalid command!');
    }
})

async function execute(message, serverQueue)
{
    let searchString = message.content.split(' ').slice(1).join(' ');
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
    {
        return message.channel.send('You need to be in a voice channel!');
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
    {
        return message.channel.send('I need the permissions to join and speak in your voice channel!');
    }

    let youtubeLink;
    if (!searchString.includes('youtube.com'))
    {
        let results = await ytSearch(searchString);
        if (results.total === 0)
        {
            return message.channel.send('No results found!');
        }
        youtubeLink = results.videos[0].url;
    }
    else
    {
        youtubeLink = searchString;
    }

    const songInfo = await ytdl.getInfo(youtubeLink);
    const song = {
        title: songInfo.videoDetails.title,
        author: songInfo.videoDetails.author.name,
        duration: songInfo.videoDetails.lengthSeconds,
        url: songInfo.videoDetails.video_url,
    }


    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queueContruct.songs.push(song);
        queue.set(message.guild.id, queueContruct);

        try {
           const connection = joinVoiceChannel({
                   channelId: voiceChannel.id,
                   guildId: voiceChannel.guildId,
                   adapterCreator: message.guild.voiceAdapterCreator,
               }
           );
           console.log(connection);
           queueContruct.connection = connection;

           play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
    else {
        serverQueue.songs.push(song);
        queue.set(message.guild.id, serverQueue);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

function skip(message, serverQueue) {
    const dispatcher = serverQueue.connection
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    dispatcher.end();
}

function stop(message, serverQueue) {
    const dispatcher = serverQueue.connection
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );

    if (!serverQueue)
        return message.channel.send("There is no song that I could stop!");

    serverQueue.songs = [];
    dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.connection.disconnect();
        queue.delete(guild.id);
        return;
    }
    console.log(generateDependencyReport());
    const player = createAudioPlayer();
    const stream = ytdl(song.url, { filter: 'audioonly' })
    const resource = createAudioResource(stream);
    serverQueue.connection.subscribe(player);

    console.log('Now playing: ' + song.title);
    player.play(resource);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

bot.login(token);

