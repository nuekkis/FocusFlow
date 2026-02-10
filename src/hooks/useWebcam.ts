import { useState, useEffect, useRef } from 'react';

export function useWebcam() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let isMounted = true;

        async function enableStream() {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user',
                    },
                });

                if (!isMounted) {
                    // Component unmounted while we were waiting.
                    // Stop the stream immediately to prevent locking the camera.
                    newStream.getTracks().forEach(track => track.stop());
                    return;
                }

                stream = newStream;
                setStream(newStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                    videoRef.current.onloadedmetadata = () => {
                        if (isMounted) setIsVideoReady(true);
                        videoRef.current?.play();
                    };
                }
            } catch (err: any) {
                if (!isMounted) return;

                console.error("Webcam blocked or not found", err);
                if (err.name === 'NotReadableError') {
                    setError('Camera is in use by another application. Please close other apps (Zoom, Teams, etc.) and reload.');
                } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera permission denied. Please allow camera access in your browser settings.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setError('No camera found. Please ensure your webcam is connected.');
                } else {
                    setError(err.message || 'Failed to access webcam');
                }
            }
        }

        enableStream();

        return () => {
            isMounted = false;
            // Stop tracks if we have them
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return { videoRef, stream, error, isVideoReady };
}
