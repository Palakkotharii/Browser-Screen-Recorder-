import { useState, useRef, useCallback } from 'react';

export interface UseScreenRecorderReturn {
    isRecording: boolean;
    recordingBlob: Blob | null;
    error: string | null;
    startRecording: (enableMic: boolean) => Promise<void>;
    stopRecording: () => void;
    resetRecording: () => void;
    stream: MediaStream | null; // For preview
}

export const useScreenRecorder = (): UseScreenRecorderReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async (enableMic: boolean) => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            let finalStream = displayStream;

            if (enableMic) {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });

                    const audioContext = new AudioContext();
                    const dest = audioContext.createMediaStreamDestination();

                    if (displayStream.getAudioTracks().length > 0) {
                        const sysSource = audioContext.createMediaStreamSource(displayStream);
                        sysSource.connect(dest);
                    }

                    const micSource = audioContext.createMediaStreamSource(audioStream);
                    micSource.connect(dest);

                    // Combine video from display and mixed audio
                    finalStream = new MediaStream([
                        ...displayStream.getVideoTracks(),
                        ...dest.stream.getAudioTracks()
                    ]);
                } catch (micErr) {
                    console.warn('Mic permission denied or error', micErr);
                    // Fallback to just screen if mic fails? Or throw?
                    // For now, continue without mic if it fails, but maybe alert user?
                    // Let's just create stream with displayStream
                }
            }

            setStream(finalStream);

            const recorder = new MediaRecorder(finalStream, {
                mimeType: 'video/webm; codecs=vp9'
            });

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordingBlob(blob);
                chunksRef.current = [];
                setIsRecording(false);
                // Stop all tracks to clear "sharing" indicator
                finalStream.getTracks().forEach(track => track.stop());
                if (displayStream !== finalStream) displayStream.getTracks().forEach(track => track.stop());
            };

            chunksRef.current = [];
            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);

            // Handle stream end (user clicks stop sharing browser UI)
            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

        } catch (err: any) {
            setError(err.message || 'Failed to start recording');
            setIsRecording(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const resetRecording = useCallback(() => {
        setRecordingBlob(null);
        setError(null);
        setStream(null);
    }, []);

    return {
        isRecording,
        recordingBlob,
        error,
        startRecording,
        stopRecording,
        resetRecording,
        stream
    };
};
