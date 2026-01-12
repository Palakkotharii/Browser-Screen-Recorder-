'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
    id: string;
    views: number;
}

export default function VideoPlayer({ id, views }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [viewCount, setViewCount] = useState(views);
    const [viewRecorded, setViewRecorded] = useState(false);
    const [completionRecorded, setCompletionRecorded] = useState(false);

    useEffect(() => {
        // Increment view count on mount (or first play?)
        // Usually view is counted on load or play. Let's do on play slightly delayed or just on load for simplicity.
        // Let's do on play to be accurate.
    }, []);

    const handlePlay = async () => {
        if (!viewRecorded) {
            setViewRecorded(true);
            try {
                await fetch(`/api/view/${id}`, {
                    method: 'POST',
                    body: JSON.stringify({ type: 'view' })
                });
                setViewCount(c => c + 1);
            } catch (e) {
                console.error('Failed to track view', e);
            }
        }
    };

    const handleEnded = async () => {
        if (!completionRecorded) {
            setCompletionRecorded(true);
            try {
                await fetch(`/api/view/${id}`, {
                    method: 'POST',
                    body: JSON.stringify({ type: 'completion' })
                });
            } catch (e) {
                console.error('Failed to track completion', e);
            }
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <video
                    ref={videoRef}
                    src={`/uploads/${id}.webm`}
                    controls
                    className="w-full h-full"
                    onPlay={handlePlay}
                    onEnded={handleEnded}
                />
            </div>

            <div className="flex items-center justify-between px-4 py-2 bg-white rounded-lg border shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold">Screen Recording</h1>
                    <p className="text-sm text-gray-500 text-xs">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                    <span>👁️ {viewCount} Views</span>
                </div>
            </div>
        </div>
    )
}
