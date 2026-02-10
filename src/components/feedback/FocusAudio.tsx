'use client';

import { useEffect, useRef } from 'react';
import { useFocusStore } from '@/store/focusStore';

export function FocusAudio() {
    const { focusScore } = useFocusStore();

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const osc1Ref = useRef<OscillatorNode | null>(null);
    const osc2Ref = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const filterNodeRef = useRef<BiquadFilterNode | null>(null);
    const isInitializedRef = useRef(false);

    // Initialize Audio Engine (User Interaction Required usually, but we try on mount/update)
    useEffect(() => {
        const initAudio = () => {
            if (isInitializedRef.current) return;

            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContext();
                audioContextRef.current = ctx;

                // Create Nodes
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                // Configuration : Deep Drone
                // Oscillator 1: Very low Sine (Sub-bass)
                osc1.type = 'sine';
                osc1.frequency.value = 55; // A1

                // Oscillator 2: Low Triangle (Texture)
                osc2.type = 'triangle';
                osc2.frequency.value = 110; // A2

                // Filter: Lowpass to make it "deep" and muffled
                filter.type = 'lowpass';
                filter.frequency.value = 200; // Start very muffled

                // Gain: Start Silent
                gain.gain.value = 0;

                // Connections
                // Osc1 -> Gain
                // Osc2 -> Gain
                // Gain -> Filter -> Destination

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(filter);
                filter.connect(ctx.destination);

                // Start Oscillators
                osc1.start();
                osc2.start();

                osc1Ref.current = osc1;
                osc2Ref.current = osc2;
                gainNodeRef.current = gain;
                filterNodeRef.current = filter;
                isInitializedRef.current = true;
            } catch (e) {
                console.error("Audio Init Failed", e);
            }
        };

        // We need a user interaction to start audio usually.
        // We can attach this to the first click on the page or just try.
        // For now, let's try to init if not already.
        // Ideally, we'd have a "Start Focus Mode" button.
        // We will try to init on mount, but browser might block it until interaction.
        // We can try resuming context on effects.

        const handleInteraction = () => {
            if (!audioContextRef.current) {
                initAudio();
            }
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            // Cleanup audio context if needed? keeping it alive is usually fine for SPA
        };
    }, []);

    // Update Audio Parameters based on Focus Score
    useEffect(() => {
        if (!audioContextRef.current || !gainNodeRef.current || !filterNodeRef.current) return;

        const ctx = audioContextRef.current;
        const gain = gainNodeRef.current;
        const filter = filterNodeRef.current;

        // Focus Logic:
        // Score 1.0 (Focused) -> Silence (Volume 0)
        // Score 0.0 (Distracted) -> Max Volume (Volume 0.5)

        const distractionLevel = 1.0 - focusScore;

        // Volume ramp
        const targetGain = distractionLevel * 0.4; // Max volume 0.4 to avoid clipping
        const rampTime = 0.5; // Smooth transition

        gain.gain.setTargetAtTime(targetGain, ctx.currentTime, rampTime);

        // Filter Logic:
        // Distracted -> Filter opens up slightly or stays deep? 
        // User said "derin bir muzik". 
        // Let's keep it lowpass but modulate frequency slightly.
        // 0.0 -> 100Hz
        // 1.0 (Distracted) -> 300Hz (bit more presence)

        const targetFreq = 100 + (distractionLevel * 200);
        filter.frequency.setTargetAtTime(targetFreq, ctx.currentTime, rampTime);

    }, [focusScore]);

    return null; // Headless
}
