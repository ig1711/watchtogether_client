import { EventEmitter } from 'node:events';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import process from 'node:process';

const SOCK_ADDR = process.platform === 'win32' ? '\\\\.\\pipe\\wt_sock' : '\0wt_sock';
const PLAYER_EXECUTABLE = './executables/player';

export default class Player extends EventEmitter {
    constructor() {
        super();
        this.connection = null;
        this.server = createServer(this.connectionListener);
        this.server.listen(SOCK_ADDR, () => {
            // this.process = spawn(PLAYER_EXECUTABLE);
            console.log('Socket server listening...');
        });
    }

    destruct() {
        if (this.server.listening) {
            this.connection?.end();
            this.server.close();
        }
    }

    connectionListener = connection => {
        if (this.connection) {
            throw Error('Player already connected. New connection received');
        }
        this.connection = connection;
        
        this.connection.on('data', this.handleData);
        this.connection.on('close', () => {
            this.connection = null;
            this.destruct();
            process.exit();
        });
    }

    handleData = jsonData => {
        const data = JSON.parse(jsonData);

        if (data['Message']) this.handleMessage(data['Message']);
        if (data['Command']) this.handleCommand(data['Command']);
    }

    handleMessage(message) {
        this.emit('chat_message', message);
    }

    handleCommand(command) {
        const commands = ['Connect', 'Disconnect', 'Paused', 'Resumed'];

        for (let c of commands) {
            if (command[c]) this.emit(c, command[c]);
        }
    }

    log(text) {
        this.sendMessage({ username: 'Client Log', content: text });
    }

    chatMessage(message) {
        this.sendMessage(message);
    }

    load(video) {
        this.sendCommand({ 'LoadVideo': video });
    }

    play() {
        this.sendCommand({ 'Play': null });
    }

    pause() {
        this.sendCommand({ 'Pause': null });
    }

    seek(timestamp) {
        this.sendCommand({ 'Seek': timestamp });
    }

    stop() {
        this.sendCommand({ 'Stop': null });
    }

    async getTimestamp() {
        this.sendCommand({ 'GetTimestamp': null });

        return new Promise((resolve, reject) => {
            this.on('timestamp', resolve);
            setTimeout(() => reject('Timeout: Player did not respond with timestamp'), 5000);
        });
    }

    sendMessage(message) {
        this.send({ 'Message': message });
    }

    sendCommand(command) {
        this.send({ 'Command': command });
    }

    send(data) {
        this.connection.write(JSON.stringify(data) + '\n');
    }
}
