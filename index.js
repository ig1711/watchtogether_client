import process from 'node:process';

import Player from './lib/player.js';
// import Server from './lib/server.js';
// import Videos from './lib/videos.js';

const player = new Player();

// const server = new Server();

// const videos = new Videos();

// player.on('Connect', async serverAddress => {
//     if (server.connected) {
//         player.log(`Already connected to server: ${server.name}`);
//         return;
//     }

//     try {
//         await server.connect(serverAddress);
//         player.log(`Connected to server: ${server.name}`);

//         player.log('Syncing playlist...');

//         try {
//             const playlist = await server.getPlaylist();
//             for (let { id, url } of playlist) {
//                 videos.add(id, url);
//             }
//             player.log(`Synced playlist. (Added ${playlist.length} items)`);
//         } catch (e) {
//             player.log('Error syncing playlist');
//             console.error(e);
//         }
//     } catch (err) {
//         player.log('Error connecting to the server');
//         console.error(err);
//     }
// });

// player.on('Disconnect', async () => {
//     if (!server.connected) {
//         player.log('Not connected to any server');
//         return;
//     }
//     const serverName = server.name;
//     try {
//         await server.disconnect();
//         player.log(`Disconnected from server: ${serverName}`);
//     } catch (err) {
//         player.log('Error disconnecting from the server');
//         console.error(err);
//     }
// });

player.on('chat_message', async message => {
    // await server.broadcastMessage(message).catch(console.error);
    console.log(message);
});

// player.on('Paused', async timestamp => {
//     await server.playerPaused(timestamp).catch(console.error);
// });

// player.on('Resumed', async timestamp => {
//     await server.playerResumed(timestamp).catch(console.error);
// });


// server.on('chat_message', message => {
//     player.chatMessage(message);
// });

// server.on('add_video', ({ id, url }) => {
//     videos.add(id, url);
// });

// server.on('load_video', id => {
//     const video = videos.get(id);
//     player.load(video);
// });

// server.on('play_video', () => {
//     player.play();
// });

// server.on('pause_video', () => {
//     player.pause();
// });

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

// setInterval(() => {
//     if (player.connection) {
//         player.log('log test');
//         player.sendMessage({ username: 'something', content: 'some content' });
//         player.sendCommand({ 'Play': null });
//     }
// }, 3000);

process.on('SIGINT', () => {
    console.log('exiting bye bye');
    player.destruct();
    process.exit();
});
