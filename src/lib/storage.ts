import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export interface VideoMetadata {
    id: string;
    createdAt: number;
    views: number;
    completions: number;
    duration?: number;
}

export interface DBSchema {
    videos: VideoMetadata[];
}

async function ensureDB() {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify({ videos: [] }));
    }
}

async function ensureUploadsDir() {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
}

export async function getVideos(): Promise<VideoMetadata[]> {
    await ensureDB();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data).videos;
}

export async function getVideo(id: string): Promise<VideoMetadata | undefined> {
    const videos = await getVideos();
    return videos.find((v) => v.id === id);
}

export async function saveVideoMetadata(metadata: VideoMetadata) {
    await ensureDB();
    const videos = await getVideos();
    videos.push(metadata);
    await fs.writeFile(DB_PATH, JSON.stringify({ videos }, null, 2));
}

export async function incrementView(id: string) {
    await ensureDB();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const db = JSON.parse(data) as DBSchema;
    const video = db.videos.find(v => v.id === id);
    if (video) {
        video.views = (video.views || 0) + 1;
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    }
}

export async function incrementCompletion(id: string) {
    await ensureDB();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const db = JSON.parse(data) as DBSchema;
    const video = db.videos.find(v => v.id === id);
    if (video) {
        video.completions = (video.completions || 0) + 1;
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
    }
}

export { UPLOADS_DIR, ensureUploadsDir };
