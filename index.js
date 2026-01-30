import Player from './lib/player.js';
import Server from './lib/server.js';
import Videos from './lib/videos.js';

const player = new Player();

const server = new Server();

const videos = new Videos();

player.on('Connect', async ({ address, username }) => {
    if (server.connected) {
        player.log(`Already connected to server: ${server.name}`);
        return;
    }

    try {
        await server.connect(address, username);
        console.log({ username, address });

        player.connected();
        player.log('Connected');

        const serverName = await server.getServerName();

        player.log(`Connected to server: ${serverName}`);

        player.log('Syncing playlist...');

        const playlist = await server.getPlaylist();

        try {
            for (let { hash, id } of playlist) {
                videos.add(hash, id);
            }
            player.log(`Synced playlist. (Added ${playlist.length} items)`);
        } catch (e) {
            player.log('Error syncing playlist');
            console.error(e);
        }
    } catch (err) {
        player.log('Error connecting to the server');
        console.error(err);
    }
});

player.on('Disconnect', async () => {
    if (!server.connected) {
        player.log('Not connected to any server');
        return;
    }
    try {
        server.disconnect();
        player.log(`Disconnected from server`);
    } catch (err) {
        player.log('Error disconnecting from the server');
        console.error(err);
    }
});

player.on('ChatMessage', message => {
    server.sendMessage(message);
    // console.log(message);
});

player.on('Paused', reason => {
    if (server.connected) server.playerPaused(reason);
});

// player.on('Resumed', async timestamp => {
//     await server.playerResumed(timestamp).catch(console.error);
// });

server.on('NewUser', username => {
    console.log(`${username} joined`);
    player.log(`${username} joined`);
});

server.on('Disconnected', () => {
    player.pause();
    player.disconnected();
});

server.on('ChatMessage', message => {
    player.chatMessage(message);
});

server.on('Add', ({ hash, id }) => {
    videos.add(hash, id);
});

server.on('Load', async ({ hash, id }) => {
    const video = videos.get(hash, id);
    await video.load();
});

server.on('Remove', ({ hash, id }) => {
    videos.remove(hash, id);
});

server.on('MpvLoad', async ({ hash, id }) => {
    const video = videos.get(hash, id);
    if (!video.loaded) await video.load();
    const link = await video.url();
    player.pause();
    player.load(link);
});

server.on('Play', () => {
    player.play();
});

server.on('Pause', ({ username, reason }) => {
    console.log(reason);
    const user_p = (reason === 'User') && 'bcz they wanted';
    const network_p = (reason === 'Network') && 'bcz of network';

    player.log(`${username} paused the video ${network_p || user_p || ''}`);
    player.pause();
});

server.on('Ping', async () => {
    const videoStatus = await videos.generateStatus();

    const playerStatus = await player.getStatus().catch(() => null);

    server.status({ videoStatus, playerStatus });
});

// server.on('seek_video', timestamp => {
//     player.seek(timestamp);
// });

// server.on('stop_video', () => {
//     player.stop();
// });

// server.on('get_timestamp', async () => {
//     const timestamp = await player.getTimestamp().catch(console.error);
//     if (!timestamp) return;
//     await server.sendTimestamp(timestamp).catch(console.error);
// });

// let count = 0;
// setInterval(() => {
//     if (player.connection) {
//         // player.log('log test');
//         player.sendMessage({ username: `user ${count}`, content: `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`.slice(Math.floor(Math.random() * 573 / 2), (574 / 2) + Math.floor(Math.random() * 573 / 2)) + count, timestamp: Date.now() });
//         count += 1;
//         // player.sendCommand({ 'Play': null });
//     }
// }, 5000);

// setTimeout(() => {
//     if (player.connection) player.sendCommand({ 'Play': null });
// }, 10000);

// process.on('SIGINT', () => {
//     console.log('exiting bye bye');
//     player.destruct();
//     process.exit();
// });

// const videos = new Videos();

// const testMagnet = 'magnet:?xt=urn:btih:b1d89133a31c8f935f7b2a4949d0e02c2dd0b589&dn=%5BErai-raws%5D%20Sanda%20-%2001%20%5B1080p%20AMZN%20WEBRip%20HEVC%20EAC3%5D%5BMultiSub%5D%5B7EA1279C%5D&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce';

// videos.add('someid', testMagnet);

// const video = videos.get('someid');

// console.log(await video.url());
