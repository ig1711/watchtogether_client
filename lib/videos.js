import WebTorrent from 'webtorrent';
import { EventEmitter } from 'node:events';

const HOST = 'localhost';
const PORT = 4000;

export default class Videos extends EventEmitter {
    constructor() {
        super();

        this.videos = new Map();

        this.client = new WebTorrent();

        this.instance = this.client.createServer({}, 'node');
        this.instance.server.listen(PORT);
    }

    destruct() {
        this.instance.server.close();
        this.client.destroy();
    }

    add(hash, id) {
        let torrent = this.client.get(hash).then(getT => {
            return getT || new Promise(resolve => {
                this.client.add(hash, { deselect: true }, function (createT) {
                    resolve(createT);
                });
            });
        });
        this.videos.set(hash+id, new Video(torrent, hash, id));
    }

    get(hash, id) {
        return this.videos.get(hash+id);
    }

    async remove(hash, id) {
        const video = this.videos.get(hash+id);
        await video.unload();
        this.videos.delete(hash+id);
    }

    async generateStatus() {
        const status = [];
        for (let [_, v] of this.videos) {
            status.push({
                id: v.id,
                hash: v.hash,
                progress: v.loaded ? (await v.torrent).files[v.id].progress : 0,
            });
        }

        return status;
    }
}

class Video {
    constructor(torrent, hash, id) {
        this.hash = hash;
        this.id = id;
        this.torrent = torrent;
        this.loaded = false;
    }

    async url() {
        return new URL(`http://${HOST}:${PORT}` + (await this.torrent).files[this.id].streamURL).toString();
    }

    async load() {
        (await this.torrent).files[this.id].select();
        this.loaded = true;
    }

    async unload() {
        if (!this.loaded) return;
        (await this.torrent).files[this.id].deselect();
    }
}
