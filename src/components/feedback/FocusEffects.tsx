'use client';

import { useEffect } from 'react';
import { useFocusStore } from '@/store/focusStore';

export function FocusEffects() {
    const { focusScore } = useFocusStore();

    useEffect(() => {
        // Map score (0.0 - 1.0) to CSS values
        // High score = 0 blur, 0 grayscale
        // Low score = 10px blur, 100% grayscale

        // Invert score for "negative" effects
        const distractionLevel = 1.0 - focusScore;

        const blurAmount = `${distractionLevel * 8}px`; // Max 8px blur
        const grayscaleAmount = `${distractionLevel * 80}%`; // Max 80% grayscale
        const contrastAmount = `${100 - (distractionLevel * 30)}%`; // Min 70% contrast

        document.documentElement.style.setProperty('--focus-blur', blurAmount);
        document.documentElement.style.setProperty('--focus-grayscale', grayscaleAmount);
        document.documentElement.style.setProperty('--focus-contrast', contrastAmount);

    }, [focusScore]);

    return null; // Headless component
}
