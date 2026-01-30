import { EventEmitter } from 'node:events';
import WebSocket from 'ws';

export default class Server extends EventEmitter {
    constructor() {
        super();

        this.connected = false;
        this.ws = null;

        this.username = '';
    }

    async connect(serverAddress, username) {
        this.username = username;

        this.ws = new WebSocket(serverAddress, { headers: { 'x-username': username } });
        await new Promise(resolve => {
            this.ws.on('open', resolve)
        });

        this.ws.on('message', wsMsg => {
            this.handleWsMsg(wsMsg);
        });

        this.ws.on('ping', () => this.heartbeat());

        // const serverName = await new Promise(resolve => {
        //     this.on('ServerName', n => {
        //         resolve(n);
        //     });
        // });

        // const playlist = await new Promise(resolve => {
        //     this.on('Playlist', pl => {
        //         resolve(pl);
        //     });
        // });


        this.connected = true;
        // this.name = serverName;
        // this.playlist = playlist;
    }

    disconnect() {
        this.ws.terminate();
        this.ws = null;
        this.connected = false;
        // this.name = '';

        this.username = '';
        this.emit('Disconnected');
    }

    heartbeat() {
        clearTimeout(this.pingTimeout);

        this.emit('Ping');

        this.pingTimeout = setTimeout(() => {
            this.disconnect();
        }, 5_000 + 1_000);
    }

    getServerName() {
        const p = new Promise(resolve => {
            this.on('ServerName', resolve);
        });
        this.sendCommand({ 'ServerName': null });
        return p;
    }

    getPlaylist() {
        const p = new Promise(resolve => {
            this.on('Playlist', resolve);
        });
        this.sendCommand({ 'Playlist': null });
        return p;
    }

    status(stat) {
        this.sendCommand({ 'Status': stat });
    }

    playerPaused(reason) {
        this.sendCommand({ 'Paused': reason });
    }

    handleWsMsg(wsMsg) {
        const data = JSON.parse(wsMsg);

        if (data['Message']) this.handleMessage(data['Message']);
        if (data['Command']) this.handleCommand(data['Command']);
    }

    handleMessage(message) {
        this.emit('ChatMessage', message);
    }

    handleCommand(command) {
        const commands = ['Add', 'Load', 'Remove','MpvLoad', 'Play', 'Pause', 'Seek', 'Stop', 'ServerName', 'Playlist', 'NewUser'];

        for (let c of commands) {
            if (command[c] !== undefined) this.emit(c, command[c]);
        }
    }

    sendUserMessage(content) {
        this.sendMessage({ username: this.username, content });
    }

    sendMessage(message) {
        message.timestamp = message.timestamp || Date.now();
        this.send({ 'Message': message });
    }

    sendCommand(command) {
        this.send({ 'Command': command });
    }

    send(data) {
        this.ws.send(JSON.stringify(data));
    }
}
