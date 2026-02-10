'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
const FocusHUD = dynamic(() => import('@/components/feedback/FocusHUD').then(mod => mod.FocusHUD), { ssr: false });
import { FocusEffects } from '@/components/feedback/FocusEffects';

export default function Home() {
  const [content, setContent] = useState("Start typing your masterpiece here... FocusFlow will handle the rest.");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-1000">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black -z-10" />

      {/* Core Logic & Feedback System */}
      <FocusEffects />
      <FocusHUD />

      {/* Editor Area */}
      <div className="w-full max-w-3xl z-10">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500">
            FocusFlow
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Your attention shapes this reality.
          </p>
        </header>

        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="relative w-full h-[60vh] p-8 text-xl leading-relaxed 
                           bg-white dark:bg-gray-900 
                           text-gray-900 dark:text-gray-100
                           rounded-lg shadow-2xl resize-none outline-none ring-0 border-none
                           placeholder:text-gray-300 dark:placeholder:text-gray-700
                           font-serif"
            spellCheck={false}
          />
        </section>

        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>Allow camera access to enable specific reactive features.</p>
        </footer>
      </div>
    </main>
  );
}
