import { NextRequest, NextResponse } from 'next/server';
import { getVideo } from '@/lib/storage';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const video = await getVideo(id);

    if (!video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(video);
}
