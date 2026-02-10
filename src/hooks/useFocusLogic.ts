import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import type { FaceMesh, Results } from '@mediapipe/face_mesh';
import { useFocusStore } from '@/store/focusStore';
import { createFaceMesh } from '@/lib/face-detection';
import { calculateEAR, calculateYaw, calculateEmotion, Keypoint } from '@/lib/math/geometry';
import { LEFT_EYE, RIGHT_EYE } from '@/lib/math/indices';

export function useFocusLogic(videoReady: boolean, videoRef: RefObject<HTMLVideoElement | null>) {
    const [faceMesh, setFaceMesh] = useState<FaceMesh | null>(null);
    const requestRef = useRef<number | null>(null);
    const previousTimeRef = useRef<number | undefined>(undefined);

    // We access store actions directly. For reading state inside callback, we use getState()
    // or we can rely on the fact that actions are stable.
    const {
        setFocusScore,
        setFocusState
    } = useFocusStore();

    // Callback for MediaPipe Results
    const onResults = useCallback((results: Results) => {
        const { focusScore } = useFocusStore.getState();

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0]; // Normalized x, y, z

            // Map to compatible Keypoint interface for our geometry functions
            // MediaPipe landmarks are {x, y, z, visibility} matches our needs roughly
            const keypoints: Keypoint[] = landmarks.map(l => ({ x: l.x, y: l.y, z: l.z }));

            // 1. Calculate EAR
            // Helper to extract points for EAR function by index
            const getEyePoints = (indices: number[]) => indices.map(i => keypoints[i]);

            const leftEar = calculateEAR(getEyePoints(LEFT_EYE));
            const rightEar = calculateEAR(getEyePoints(RIGHT_EYE));
            const avgEar = (leftEar + rightEar) / 2;

            // 2. Calculate Pose (Yaw)
            const yaw = calculateYaw(keypoints);

            // 3. Emotion Detection
            const emotion = calculateEmotion(keypoints);
            useFocusStore.getState().setEmotion(emotion);

            // 4. Logic: Determine Focus
            const EAR_THRESHOLD = 0.15;
            const YAW_THRESHOLD = 0.4;

            // Debug logging
            // console.log(`Focus Monitor -> EAR: ${avgEar.toFixed(3)}, Yaw: ${yaw.toFixed(3)}, Emotion: ${emotion}`);

            let targetScoreChange = 0;
            let currentStat = 'FOCUSED';

            // Eyes Closed?
            if (avgEar < EAR_THRESHOLD) {
                targetScoreChange = -0.05;
                currentStat = 'DROWSY';
            }
            // Looking away?
            else if (Math.abs(yaw) > YAW_THRESHOLD) {
                targetScoreChange = -0.02;
                currentStat = 'DISTRACTED';
            }
            // Good?
            else {
                targetScoreChange = 0.01;
                currentStat = 'FOCUSED';
            }

            // SMOOTHING LOGIC
            // Instead of instantaneous update, we move towards the target.
            // If we are losing focus (target < current), we go slow (decay).
            // If we are gaining focus, we can go a bit faster or similar.

            // Actually, our logic above calculates a *Change* (delta).
            // Let's refine: We define a "Target Score" based on state? 
            // Or just apply the delta with smoothing?

            // Let's stick to the delta approach but dampen the negative deltas.

            let finalChange = targetScoreChange;
            if (targetScoreChange < 0) {
                // Slow down penalties (e.g., occlusion or brief look away)
                finalChange *= 0.2; // 5x slower penalty
            } else {
                // Normal recovery
                finalChange *= 1.0;
            }

            const newScore = Math.min(Math.max(focusScore + finalChange, 0), 1);
            setFocusScore(newScore);
            setFocusState(currentStat as any);

        } else {
            // No Face - Decay slowly instead of instant penalty
            // likely occlusion or brief loss of tracking
            const decay = 0.002; // Very slow decay
            setFocusScore(Math.max(focusScore - decay, 0));
            setFocusState('DISTRACTED');
        }
    }, [setFocusScore, setFocusState]);

    // Initialize FaceMesh
    useEffect(() => {
        let active = true;
        async function load() {
            if (!faceMesh) {
                console.log("Loading FaceMesh (Native)...");
                try {
                    const net = await createFaceMesh();
                    if (!active) return;

                    net.onResults(onResults);
                    setFaceMesh(net);
                    console.log("FaceMesh Loaded");
                } catch (e) {
                    console.error("Failed to load FaceMesh", e);
                }
            }
        }
        load();
        return () => { active = false; };
    }, [faceMesh, onResults]);

    // Animation Loop
    useEffect(() => {
        if (!videoReady || !faceMesh || !videoRef.current) return;

        const animate = async (time: number) => {
            // Optional throttling could go here
            previousTimeRef.current = time;

            if (videoRef.current && videoRef.current.readyState >= 2) {
                try {
                    await faceMesh.send({ image: videoRef.current });
                } catch (e) {
                    // console.error("Send Error", e); 
                    // Often causes noise if frame not ready
                }
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [videoReady, faceMesh, videoRef]);

    return { detector: faceMesh };
}
