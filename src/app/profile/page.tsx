'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { ProfileView } from '../../components/profile/ProfileView';

export default function ProfilePage() {
  const [currentTab, setCurrentTab] = useState<'library' | 'feed' | 'profile'>('profile');

  // If user clicks another tab while on /profile, navigate to main page with that tab
  const handleTabChange = (tab: 'library' | 'feed' | 'profile') => {
    if (tab === 'profile') {
      setCurrentTab('profile');
    } else {
      window.location.href = `/?tab=${tab}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-zinc-100 flex flex-col justify-between selection:bg-fuchsia-500 selection:text-white relative">
      {/* Zero-repaint GPU compositor layer */}
      <div className="fixed-aura-bg" />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        <Navbar currentTab={currentTab} setCurrentTab={handleTabChange} />

        <main className="flex-1 pb-24 sm:pb-28 relative w-full">
          <React.Suspense fallback={<div className="min-h-screen bg-[#0a0b0f]" />}>
            <ProfileView />
          </React.Suspense>
        </main>

        <footer className="border-t border-white/[0.08] bg-[#0a0b0f] py-10 px-4 sm:px-8 text-center text-xs text-zinc-400 space-y-3">
          <p className="text-zinc-500">
            © 2026 ReadVerse. The reader-first webtoon and novel ecosystem.
          </p>
        </footer>
      </div>
    </div>
  );
}
