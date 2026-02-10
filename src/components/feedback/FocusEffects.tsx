'use client';

import { useEffect, useRef } from 'react';
import { useFocusStore } from '@/store/focusStore';

export function FocusEffects() {
    const { focusScore } = useFocusStore();
    const prevScore = useRef(focusScore);

    useEffect(() => {
        // Determine direction for transition duration
        const isLosingFocus = focusScore < prevScore.current;
        prevScore.current = focusScore;

        // User request: "bulaniktan netliğe geçen sürenin iki katı olacak" 
        // Interpreted as: Blur (Focus Loss) should be slowly to avoid jarring effect.
        // Recovery (Focus Gain) can be faster or standard.
        // Setting Blur Duration to 2000ms (Slow)
        // Setting Clear Duration to 800ms (Moderate/Fast)

        const duration = isLosingFocus ? '2000ms' : '800ms';
        document.documentElement.style.setProperty('--focus-transition-duration', duration);

        // Map score (0.0 - 1.0) to CSS values
        const distractionLevel = 1.0 - focusScore;

        const blurAmount = `${distractionLevel * 8}px`; // Max 8px blur
        const grayscaleAmount = `${distractionLevel * 80}%`; // Max 80% grayscale
        const contrastAmount = `${100 - (distractionLevel * 30)}%`; // Min 70% contrast

        document.documentElement.style.setProperty('--focus-blur', blurAmount);
        document.documentElement.style.setProperty('--focus-grayscale', grayscaleAmount);
        document.documentElement.style.setProperty('--focus-contrast', contrastAmount);

    }, [focusScore]);

    return null;
}
