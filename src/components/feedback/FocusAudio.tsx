'use client';

import { useEffect, useRef } from 'react';
import { useFocusStore } from '@/store/focusStore';

export function FocusAudio() {
    const { focusScore } = useFocusStore();

    // Audio Context & Nodes
    const audioContextRef = useRef<AudioContext | null>(null);

    // Buffers
    const backgroundBufferRef = useRef<AudioBuffer | null>(null);
    const freesoundBufferRef = useRef<AudioBuffer | null>(null);

    // Sources (Active loops)
    const bgSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const fsSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Gains
    const bgGainRef = useRef<GainNode | null>(null);
    const fsGainRef = useRef<GainNode | null>(null);

    const isInitializedRef = useRef(false);

    // Load Audio Files
    useEffect(() => {
        const loadAudio = async () => {
            if (isInitializedRef.current) return;

            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContext();
                audioContextRef.current = ctx;

                // Create Master Gain for safety
                const masterGain = ctx.createGain();
                masterGain.connect(ctx.destination);

                // Create Track Gains
                const bgGain = ctx.createGain();
                const fsGain = ctx.createGain();

                bgGain.gain.value = 0; // Start silent
                fsGain.gain.value = 0; // Start silent

                bgGain.connect(masterGain);
                fsGain.connect(masterGain);

                bgGainRef.current = bgGain;
                fsGainRef.current = fsGain;

                // Load Files
                const loadFile = async (url: string) => {
                    console.log(`Attempting to load: ${url}`);
                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                            throw new Error(`Fetch failed: ${response.status}`);
                        }
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                        console.log(`Successfully loaded and decoded: ${url}`);
                        return audioBuffer;
                    } catch (err) {
                        console.error(`Error loading file ${url}:`, err);
                        throw err;
                    }
                };

                console.log("Starting Audio Loading Sequence...");
                const [bgBuffer, fsBuffer] = await Promise.all([
                    loadFile('/backgroundmusicforvideo-documentary-sad-sorrowful-music-479773.mp3'),
                    loadFile('/freesound_community-sad-movie-sounds_01-49494.mp3')
                ]);
                console.log("All Audio Files Loaded Successfully");

                backgroundBufferRef.current = bgBuffer;
                freesoundBufferRef.current = fsBuffer;

                isInitializedRef.current = true;

                // Start loops immediately but muted
                startLoops(ctx, bgBuffer, fsBuffer, bgGain, fsGain);

            } catch (e) {
                console.error("Audio Init Failed", e);
            }
        };

        const startLoops = (ctx: AudioContext, bgBuf: AudioBuffer, fsBuf: AudioBuffer, bgGain: GainNode, fsGain: GainNode) => {
            // Background Loop
            const bgSource = ctx.createBufferSource();
            bgSource.buffer = bgBuf;
            bgSource.loop = true;
            bgSource.connect(bgGain);
            bgSource.start();
            bgSourceRef.current = bgSource;

            // Freesound Loop
            const fsSource = ctx.createBufferSource();
            fsSource.buffer = fsBuf;
            fsSource.loop = true;
            fsSource.connect(fsGain);
            fsSource.start();
            fsSourceRef.current = fsSource;
        };

        // Initialize on first interaction to allow audio
        const handleInteraction = () => {
            if (!audioContextRef.current) {
                loadAudio();
            } else if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            // Cleanup sources logic if needed
            if (bgSourceRef.current) bgSourceRef.current.stop();
            if (fsSourceRef.current) fsSourceRef.current.stop();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // Logic: Update Volumes based on Score
    useEffect(() => {
        if (!bgGainRef.current || !fsGainRef.current || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const bgGain = bgGainRef.current;
        const fsGain = fsGainRef.current;
        const rampTime = 0.5;

        // Condition 1: Score <= 0.6 -> Play Background
        // Condition 2: Score == 0.0 -> Play Freesound (Exclusive?)
        // Let's interpret "tamamen %0 olursa freesound yazan çalacak" as:
        // if score == 0: Freesound ON, Background OFF
        // if 0 < score <= 0.6: Background ON, Freesound OFF
        // else (score > 0.6): Both OFF

        let targetBgVol = 0;
        let targetFsVol = 0;

        if (focusScore === 0) {
            targetBgVol = 0;
            targetFsVol = 1.0;
        } else if (focusScore <= 0.6) {
            targetBgVol = 1.0;
            targetFsVol = 0;
        } else {
            // High focus
            targetBgVol = 0;
            targetFsVol = 0;
        }

        if (audioContextRef.current?.state === 'suspended') {
            console.log("AudioContext suspended in update loop, trying to resume...");
            audioContextRef.current.resume();
        }

        console.log(`Audio Update -> Score: ${focusScore.toFixed(3)} | Targets - BG: ${targetBgVol}, FS: ${targetFsVol} | CTX State: ${audioContextRef.current?.state}`);

        bgGain.gain.setTargetAtTime(targetBgVol, ctx.currentTime, rampTime);
        fsGain.gain.setTargetAtTime(targetFsVol, ctx.currentTime, rampTime);

    }, [focusScore]);

    return null;
}
