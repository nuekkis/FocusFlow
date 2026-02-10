'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Play } from 'lucide-react';

interface LoginOverlayProps {
    onStart: () => void;
}

export function LoginOverlay({ onStart }: LoginOverlayProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    const handleStart = () => {
        setIsFading(true);
        // Wait for animation
        setTimeout(() => {
            setIsVisible(false);
            onStart();
        }, 500);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500",
                isFading ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black z-[-1]" />

            <button
                onClick={handleStart}
                className="group relative px-8 py-4 bg-white/5 border border-white/10 rounded-full 
                           backdrop-blur-sm hover:bg-white/10 hover:border-white/20 hover:scale-105 
                           transition-all duration-300 flex items-center gap-4 group"
            >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                    <Play className="w-4 h-4 text-emerald-400 ml-0.5" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-white font-medium tracking-wide">Press to Login</span>
                    <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Initialize Focus System</span>
                </div>
            </button>
        </div>
    );
}
