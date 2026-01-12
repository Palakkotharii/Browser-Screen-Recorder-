'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ffmpegService } from '@/lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Video, Scissors, Save, X } from 'lucide-react';

interface TrimmerProps {
    file: Blob;
    onTrimComplete: (trimmedBlob: Blob) => void;
    onCancel: () => void;
}

export default function Trimmer({ file, onTrimComplete, onCancel }: TrimmerProps) {
    const [ready, setReady] = useState(false);
    const [trimming, setTrimming] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [progress, setProgress] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            await ffmpegService.load();
            setReady(true);
        } catch (e) {
            console.error('Failed to load ffmpeg', e);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
            setEndTime(videoRef.current.duration);
        }
    };

    const handleTrim = async () => {
        if (!ready) return;
        setTrimming(true);
        const ffmpeg = ffmpegService.instance;

        try {
            // Write file to MEMFS
            await ffmpeg.writeFile('input.webm', await fetchFile(file));

            // Run trim command
            // -ss start -to end -c copy (fast trim)
            // Note: -c copy might be inaccurate for keyframes.
            // If precision is needed, re-encoding is better but slower.
            // MVP: Try copy, if issues, remove -c copy.
            // For webm/vp9, re-encoding usually safer but copy is instant.
            // Let's try re-encoding for safety as this is client side and performance might be ok for short clips?
            // Actually, let's try copy first for speed.

            ffmpeg.on('progress', ({ progress, time }) => {
                setProgress(progress);
            });

            await ffmpeg.exec([
                '-i', 'input.webm',
                '-ss', startTime.toString(),
                '-to', endTime.toString(),
                '-c', 'copy',
                'output.webm'
            ]);

            const data = await ffmpeg.readFile('output.webm');
            const trimmedBlob = new Blob([data as unknown as BlobPart], { type: 'video/webm' });
            onTrimComplete(trimmedBlob);

            // Cleanup
            await ffmpeg.deleteFile('input.webm');
            await ffmpeg.deleteFile('output.webm');

        } catch (e) {
            console.error(e);
            alert('Trimming failed');
        } finally {
            setTrimming(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in slide-in-from-bottom-10">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <Scissors className="w-5 h-5" /> Trim Video
            </h3>

            {!ready && <p>Loading FFmpeg...</p>}

            <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    src={URL.createObjectURL(file)}
                    controls
                    className="w-full max-h-[50vh]"
                    onLoadedMetadata={handleLoadedMetadata}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Start Time ({startTime.toFixed(1)}s)</label>
                    <input
                        type="range"
                        min={0}
                        max={videoDuration}
                        step={0.1}
                        value={startTime}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setStartTime(Math.min(val, endTime - 1));
                            if (videoRef.current) videoRef.current.currentTime = val;
                        }}
                        className="w-full"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">End Time ({endTime.toFixed(1)}s)</label>
                    <input
                        type="range"
                        min={0}
                        max={videoDuration}
                        step={0.1}
                        value={endTime}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEndTime(Math.max(val, startTime + 1));
                            if (videoRef.current) videoRef.current.currentTime = val;
                        }}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="flex gap-4 justify-end">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                    disabled={trimming}
                >
                    Cancel
                </button>
                <button
                    onClick={handleTrim}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                    disabled={!ready || trimming}
                >
                    {trimming ? `Trimming...` : 'Confirm Trim'}
                </button>
            </div>
        </div>
    );
}
