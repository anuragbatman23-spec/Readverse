'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../components/layout/Navbar';
import { LibraryView } from '../components/library/LibraryView';
import { FeedView } from '../components/social/FeedView';
import { ProfileView } from '../components/profile/ProfileView';
import { CreatePostModal } from '../components/social/CreatePostModal';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<'library' | 'feed' | 'profile'>('library');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'profile' || tabParam === 'feed' || tabParam === 'library') {
      setCurrentTab(tabParam as 'library' | 'feed' | 'profile');
    }
  }, [searchParams]);

  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false
  });

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-zinc-100 flex flex-col justify-between selection:bg-fuchsia-500 selection:text-white relative">
      {/* Zero-repaint GPU compositor layer */}
      <div className="fixed-aura-bg" />

      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        <main className={`flex-1 pb-24 sm:pb-28 relative w-full ${currentTab === 'library' ? '-mt-20 sm:-mt-24' : ''}`}>
          {currentTab === 'library' && <LibraryView />}
          {currentTab === 'feed' && (
            <div className="w-full max-w-[1680px] px-2 sm:px-4 lg:px-6 mx-auto pt-4 sm:pt-6">
              <FeedView />
            </div>
          )}
          {currentTab === 'profile' && <ProfileView />}
        </main>

        <footer className="border-t border-white/[0.08] bg-[#0a0b0f] py-10 px-4 sm:px-8 text-center text-xs text-zinc-400 space-y-3">
          <p className="text-zinc-500">
            © 2026 ReadVerse. The reader-first webtoon and novel ecosystem.
          </p>
        </footer>
      </div>

      {/* Global Modals */}
      <CreatePostModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig({ isOpen: false })}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0b0f]" />}>
      <AppContent />
    </Suspense>
  );
}
