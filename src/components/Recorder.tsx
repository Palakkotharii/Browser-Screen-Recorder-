'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useScreenRecorder } from '@/hooks/useScreenRecorder';
import { Mic, MicOff, StopCircle, Video, Play, Download, Trash2, Scissors } from 'lucide-react';
import Trimmer from './Trimmer';

export default function Recorder() {
    const { isRecording, recordingBlob, startRecording, stopRecording, resetRecording, stream, error } = useScreenRecorder();
    const [enableMic, setEnableMic] = useState(false);
    const [isTrimming, setIsTrimming] = useState(false);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);

    // If trimmedBlob exists, show that, otherwise show recordingBlob
    // Wait, let's keep it simple: recordingBlob is THE blob. Trimmer returns a new one, we can replace recordingBlob?
    // But useScreenRecorder manages recordingBlob state.
    // We should probably just manage "currentBlob" in this component or add setRecordingBlob to hook output?
    // Simpler: use local state `activeBlob` initialized with recordingBlob.
    // Wait, hooks update.
    // Just use a local state that defaults to recordingBlob if not set.

    // Better: when recording finishes (`recordingBlob` changes), set `activeBlob`.
    const [activeBlob, setActiveBlob] = useState<Blob | null>(null);

    useEffect(() => {
        if (recordingBlob) {
            setActiveBlob(recordingBlob);
        } else {
            setActiveBlob(null);
            setTrimmedBlob(null);
            setIsTrimming(false);
            setUploadUrl(null); // Reset upload URL when recording is reset
        }
    }, [recordingBlob]);

    useEffect(() => {
        if (videoPreviewRef.current && stream) {
            videoPreviewRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleUpload = async () => {
        if (!activeBlob) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', activeBlob);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.id) {
                setUploadUrl(`${window.location.origin}/watch/${data.id}`);
            }
        } catch (e) {
            console.error(e);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    if (activeBlob) {
        if (isTrimming) {
            return (
                <div className="w-full max-w-5xl mx-auto p-6">
                    <Trimmer
                        file={activeBlob}
                        onTrimComplete={(blob) => {
                            setActiveBlob(blob);
                            setIsTrimming(false);
                            setUploadUrl(null); // Reset upload URL if trimmed
                        }}
                        onCancel={() => setIsTrimming(false)}
                    />
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto p-6 animate-in fade-in duration-500">
                <div className="w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
                    <video
                        src={URL.createObjectURL(activeBlob)}
                        controls
                        className="w-full h-auto max-h-[70vh]"
                    />
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                    {uploadUrl ? (
                        <div className="flex flex-col items-center gap-2 bg-green-50 p-4 rounded-lg border border-green-200 w-full max-w-md animate-in slide-in-from-bottom-5">
                            <p className="text-green-800 font-medium">Video Uploaded Successfully!</p>
                            <div className="flex items-center gap-2 w-full">
                                <input
                                    readOnly
                                    value={uploadUrl}
                                    className="flex-1 px-3 py-2 border rounded text-sm bg-white"
                                    onClick={(e) => e.currentTarget.select()}
                                />
                                <a
                                    href={uploadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                                >
                                    Open
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-4 justify-center items-center w-full">
                            <button
                                onClick={resetRecording}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                                Discard
                            </button>

                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Download className="w-5 h-5 rotate-180" /> // Upload icon surrogate
                                )}
                                {isUploading ? 'Uploading...' : 'Upload & Share'}
                            </button>

                            <a
                                href={URL.createObjectURL(activeBlob)}
                                download="recording.webm"
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Download WebM
                            </a>

                            <button
                                onClick={() => setIsTrimming(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Scissors className="w-5 h-5" />
                                Edit / Trim
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-8 p-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {isRecording ? (
                <div className="flex flex-col items-center w-full max-w-5xl gap-6">
                    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                        <video
                            ref={videoPreviewRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute top-4 right-4 animate-pulse">
                            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                                REC
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={stopRecording}
                        className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-xl hover:shadow-red-500/20"
                    >
                        <StopCircle className="w-8 h-8" />
                        Stop Recording
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-8 text-center animate-in zoom-in duration-500">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">Ready to record?</h2>
                        <p className="text-gray-500">Enable microphone to record audio with your screen.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-full shadow-md border border-gray-200">
                        <button
                            onClick={() => setEnableMic(false)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${!enableMic ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <MicOff className="w-5 h-5" /> No Mic
                        </button>
                        <button
                            onClick={() => setEnableMic(true)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${enableMic ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Mic className="w-5 h-5" /> Microphone
                        </button>
                    </div>

                    <button
                        onClick={() => startRecording(enableMic)}
                        className="group flex items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 rounded-2xl text-2xl font-bold transition-all transform hover:scale-105 shadow-2xl hover:shadow-indigo-500/30"
                    >
                        <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                            <Video className="w-8 h-8" />
                        </div>
                        Start Recording
                    </button>
                </div>
            )}
        </div>
    )
}
