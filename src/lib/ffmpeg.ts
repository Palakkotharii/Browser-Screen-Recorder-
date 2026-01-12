import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
    private ffmpeg: FFmpeg | null = null;
    private loaded: boolean = false;

    async load() {
        if (this.loaded && this.ffmpeg) return;

        if (!this.ffmpeg) {
            this.ffmpeg = new FFmpeg();
        }

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this.loaded = true;
    }

    get instance() {
        if (!this.ffmpeg) {
            throw new Error("FFmpeg not initialized. Call load() first.");
        }
        return this.ffmpeg;
    }

    get isLoaded() {
        return this.loaded;
    }
}

export const ffmpegService = new FFmpegService();
