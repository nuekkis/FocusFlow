'use client';

import React from 'react';
import Webcam from 'react-webcam';
import { useWebcam } from '@/hooks/useWebcam';
import { useFocusLogic } from '@/hooks/useFocusLogic';
import { useFocusStore } from '@/store/focusStore';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Activity, Brain } from 'lucide-react';

export function FocusHUD() {
    const { videoRef, isVideoReady } = useWebcam();
    // Initialize logic hook (it attaches to the videoRef automatically)
    useFocusLogic(isVideoReady, videoRef);

    const { focusScore, focusState, emotion } = useFocusStore();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {/* Score Card */}
            <div className={cn(
                "bg-black/50 backdrop-blur-md p-3 rounded-lg border border-white/10 text-white transition-all duration-300",
                focusState === 'DISTRACTED' && "border-red-500/50 bg-red-900/20",
                focusState === 'DROWSY' && "border-yellow-500/50 bg-yellow-900/20",
                focusState === 'FOCUSED' && "border-emerald-500/50 bg-emerald-900/20"
            )}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {/* Radial Progress */}
                        <svg className="w-10 h-10 transform -rotate-90">
                            <circle
                                cx="20" cy="20" r="16"
                                stroke="currentColor" strokeWidth="4" fill="transparent"
                                className="text-white/10"
                            />
                            <circle
                                cx="20" cy="20" r="16"
                                stroke="currentColor" strokeWidth="4" fill="transparent"
                                strokeDasharray={100}
                                strokeDashoffset={100 - (focusScore * 100)}
                                className={cn(
                                    "transition-all duration-500",
                                    focusScore > 0.8 ? "text-emerald-500" :
                                        focusScore > 0.4 ? "text-yellow-500" : "text-red-500"
                                )}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white/80" />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wider text-white/50 font-semibold">Focus Level</span>
                        <span className="text-lg font-bold font-mono">{(focusScore * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div className="mt-2 text-xs flex items-center justify-between text-white/70 w-full">
                    <div className="flex items-center gap-1.5">
                        <Activity className="w-3 h-3" />
                        <span className="font-semibold text-white">{focusState}</span>
                    </div>
                    {emotion !== 'NEUTRAL' && (
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/90">
                            {emotion}
                        </span>
                    )}
                </div>
            </div>

            {/* Hidden/Mini Webcam Preview */}
            <div className="relative w-32 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl group">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-white">Live Feed</span>
                </div>
            </div>
        </div>
    );
}
