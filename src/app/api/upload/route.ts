import { NextRequest, NextResponse } from 'next/server';
import { saveVideoMetadata, ensureUploadsDir, UPLOADS_DIR } from '@/lib/storage';
import { writeFile } from 'fs/promises';
import path from 'path';
import { join } from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const id = crypto.randomUUID();
        const fileName = `${id}.webm`;

        await ensureUploadsDir();
        const filePath = join(UPLOADS_DIR, fileName);

        await writeFile(filePath, buffer);

        await saveVideoMetadata({
            id,
            createdAt: Date.now(),
            views: 0,
            completions: 0,
            duration: 0 // meaningful duration would require ffprobe or frontend to send it
        });

        return NextResponse.json({ id, url: `/uploads/${fileName}` });
    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
