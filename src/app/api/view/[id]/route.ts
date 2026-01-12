import { NextRequest, NextResponse } from 'next/server';
import { incrementView, incrementCompletion } from '@/lib/storage';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { type } = body; // 'view' or 'completion'

        if (type === 'view') {
            await incrementView(id);
        } else if (type === 'completion') {
            await incrementCompletion(id);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
    }
}
