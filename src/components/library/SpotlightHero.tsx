'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, ArrowUpRight, Star } from 'lucide-react';
import { Book } from '../../types';
import { resolveCoverUrl } from '../../utils/imageOptimizer';

export interface SpotlightItem extends Book {
  views: string;
  displayRating: string;
  updateStatus: string;
  badgeType: 'MANGA' | 'MANHWA' | 'WEBTOON' | 'LIGHT NOVEL' | 'WEB NOVEL' | 'BOOK';
  bannerImage: string;
}

export const SPOTLIGHT_BOOKS: SpotlightItem[] = [
  // 1. MANGA PICK #1: Chainsaw Man
  {
    id: 'a7774250-d070-4cd0-8d9d-62f9fd149360',
    title: 'Chainsaw Man',
    author: 'Tatsuki Fujimoto',
    category: 'manga',
    coverImage: 'https://uploads.mangadex.org/covers/e896c48c-3150-437d-ba57-d8567eb399ae/fa06e4e4-ef2a-477b-bfb6-a2a88793620b.jpg.512.jpg',
    bannerImage: '/spotlights/chainsaw-man.webp',
    description: 'Denji lived a life of poverty and debt until he fused with his chainsaw devil dog Pochita, reviving as Chainsaw Man to hunt devils for Public Safety.',
    genre: ['Action', 'Dark Fantasy', 'Supernatural'],
    rating: 8.9,
    displayRating: '8.9',
    views: '11.2M VIEWS',
    updateStatus: 'HOT RELEASE',
    badgeType: 'MANGA',
    pointsPerChapter: 1.0,
    chapters: []
  },
  // 2. MANGA PICK #2: Berserk
  {
    id: '801513ba-a712-498c-8f57-415b86f7f126',
    title: 'Berserk',
    author: 'Kentaro Miura',
    category: 'manga',
    coverImage: 'https://uploads.mangadex.org/covers/801513ba-a712-498c-8f57-cae55b38cc92/81e1c82d-6672-400c-8c58-4ff9bfb89031.jpg.512.jpg',
    bannerImage: '/spotlights/berserk.webp',
    description: 'Guts, known as the Black Swordsman, seeks sanctuary from demonic forces and vengeance against the former brother-in-arms who sacrificed his comrades.',
    genre: ['Dark Fantasy', 'Action', 'Gothic'],
    rating: 9.6,
    displayRating: '9.6',
    views: '15.1M VIEWS',
    updateStatus: 'MASTERPIECE',
    badgeType: 'MANGA',
    pointsPerChapter: 1.0,
    chapters: []
  },
  // 3. MANHWA PICK #1: Solo Leveling
  {
    id: '32d76d19-8a05-4db0-9fc2-e0b0648fe9d0',
    title: 'Solo Leveling',
    author: 'Chugong, DUBU',
    category: 'manhwa',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg',
    bannerImage: '/spotlights/solo-leveling.webp',
    description: 'In a world where hunters battle deadly monsters, Sung Jin-woo, the weakest hunter of all mankind, awakens a quest system only he can see.',
    genre: ['Action', 'Fantasy', 'Supernatural'],
    rating: 9.5,
    displayRating: '9.5',
    views: '14.8M VIEWS',
    updateStatus: 'TOP RATED',
    badgeType: 'WEBTOON',
    pointsPerChapter: 1.5,
    chapters: []
  },
  // 4. MANHWA PICK #2: Omniscient Reader's Viewpoint
  {
    id: 'a0732eb2-1264-4228-b118-29373cf584ee',
    title: "Omniscient Reader's Viewpoint",
    author: 'sing N song, Sleepy-C',
    category: 'manhwa',
    coverImage: 'https://uploads.mangadex.org/covers/9a414441-bbad-43f1-a3a7-dc262ca790a3/be18dc9a-7f1c-4ca5-b318-ffff2d7d58c3.jpg.512.jpg',
    bannerImage: '/spotlights/orv.webp',
    description: 'Kim Dokja was the sole reader of an obscure apocalyptic novel. When the story becomes reality, only he knows the ending of the world.',
    genre: ['Action', 'Fantasy', 'Apocalypse'],
    rating: 9.4,
    displayRating: '9.4',
    views: '10.5M VIEWS',
    updateStatus: 'RECENTLY UPDATED',
    badgeType: 'WEBTOON',
    pointsPerChapter: 1.5,
    chapters: []
  },
  // 5. LIGHT NOVEL PICK #1: The Eminence in Shadow
  {
    id: 'ln-novelbuddy:to-be-a-power-in-the-shadows',
    title: 'The Eminence in Shadow',
    author: 'Daisuke Aizawa',
    category: 'lightnovel',
    coverImage: 'https://rs.novelbuddy.me/covers/to-be-a-power-in-the-shadows.png',
    bannerImage: '/spotlights/eminence-in-shadow.webp',
    description: 'Cid Kagenou longs not to be the hero, but the mastermind pulling strings in the shadows. Reincarnated into a magic world as Shadow, his fabricated conspiracies turn out true.',
    genre: ['Comedy', 'Action', 'Isekai', 'Fantasy'],
    rating: 9.2,
    displayRating: '9.2',
    views: '8.4M VIEWS',
    updateStatus: 'FAN FAVORITE',
    badgeType: 'LIGHT NOVEL',
    pointsPerChapter: 2.0,
    wordCountPerPoint: 1200,
    chapters: [],
    pluginId: 'novelbuddy',
    sourcePath: 'to-be-a-power-in-the-shadows'
  },
  // 6. LIGHT NOVEL PICK #2: Classroom of the Elite
  {
    id: 'ln-novelbuddy:classroom-of-the-elite',
    title: 'Classroom of the Elite',
    author: 'Shōgo Kinugasa',
    category: 'lightnovel',
    coverImage: 'https://rs.novelbuddy.me/covers/classroom-of-the-elite.png',
    bannerImage: '/spotlights/classroom-of-the-elite.webp',
    description: 'Tokyo Metropolitan Advanced Nurturing High School guarantees 100% employment. Kiyotaka Ayanokōji is placed in D-Class, quietly manipulating class wars from the shadows.',
    genre: ['Psychological', 'School', 'Drama', 'Strategy'],
    rating: 9.3,
    displayRating: '9.3',
    views: '9.7M VIEWS',
    updateStatus: 'PSYCHOLOGICAL',
    badgeType: 'LIGHT NOVEL',
    pointsPerChapter: 2.0,
    wordCountPerPoint: 1200,
    chapters: [],
    pluginId: 'novelbuddy',
    sourcePath: 'classroom-of-the-elite'
  },
  // 7. WEB NOVEL PICK #1: Shadow Slave
  {
    id: 'ln-novelbuddy:shadow-slave',
    title: 'Shadow Slave',
    author: 'Guiltythree',
    category: 'webnovel',
    coverImage: 'https://rs.novelbuddy.me/covers/shadow-slave.png',
    bannerImage: '/spotlights/shadow-slave.webp',
    description: 'Growing up in poverty, Sunny was infected by the Nightmare Spell. Transported to the ruined Forgotten Shore, his Treacherous Shadow aspect forces him into a deadly battle for survival.',
    genre: ['Progression', 'Dark Fantasy', 'LitRPG'],
    rating: 9.7,
    displayRating: '9.7',
    views: '18.4M VIEWS',
    updateStatus: 'TRENDING #1',
    badgeType: 'WEB NOVEL',
    pointsPerChapter: 2.0,
    wordCountPerPoint: 1200,
    chapters: [],
    pluginId: 'novelbuddy',
    sourcePath: 'shadow-slave'
  },
  // 8. WEB NOVEL PICK #2: Lord of the Mysteries
  {
    id: 'ln-novelbuddy:lord-of-the-mysteries',
    title: 'Lord of the Mysteries',
    author: 'Cuttlefish That Loves Diving',
    category: 'webnovel',
    coverImage: 'https://rs.novelbuddy.me/covers/lord-of-the-mysteries.png',
    bannerImage: '/spotlights/lord-of-the-mysteries.webp',
    description: 'Zhou Mingrui is reincarnated into a Victorian steampunk world with Tarot secret societies and 22 mystical Beyonder potion pathways crawling with cosmic horror madness.',
    genre: ['Steampunk', 'Mystery', 'Lovecraftian', 'Fantasy'],
    rating: 9.8,
    displayRating: '9.8',
    views: '21.6M VIEWS',
    updateStatus: 'EPIC SAGA',
    badgeType: 'WEB NOVEL',
    pointsPerChapter: 2.0,
    wordCountPerPoint: 1200,
    chapters: [],
    pluginId: 'novelbuddy',
    sourcePath: 'lord-of-the-mysteries'
  },
  // 9. BOOK PICK #1: Dracula
  {
    id: 'gutenberg-345',
    title: 'Dracula',
    author: 'Bram Stoker',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/12216503-L.jpg',
    bannerImage: '/spotlights/dracula.webp',
    description: 'The iconic gothic horror masterpiece following Count Dracula’s attempt to move from Transylvania to England to spread the undead curse.',
    genre: ['Horror', 'Gothic', 'Classic'],
    rating: 9.4,
    displayRating: '9.4',
    views: '7.2M READS',
    updateStatus: 'GOTHIC MASTERPIECE',
    badgeType: 'BOOK',
    pointsPerChapter: 2.0,
    chapters: []
  },
  // 10. BOOK PICK #2: The Adventures of Sherlock Holmes
  {
    id: 'gutenberg-1661',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/6717853-L.jpg',
    bannerImage: '/spotlights/sherlock-holmes.webp',
    description: 'Twelve classic mystery investigations featuring the world’s most celebrated consulting detective, Sherlock Holmes, and Dr. John Watson in Victorian London.',
    genre: ['Mystery', 'Detective', 'Classic'],
    rating: 9.5,
    displayRating: '9.5',
    views: '8.9M READS',
    updateStatus: 'TIMELESS CLASSIC',
    badgeType: 'BOOK',
    pointsPerChapter: 2.0,
    chapters: []
  }
];

interface SpotlightHeroProps {
  onOpenBook: (book: Book) => void;
  onExploreCatalogue?: () => void;
}

const SpotlightHeroComponent: React.FC<SpotlightHeroProps> = ({
  onOpenBook,
  onExploreCatalogue
}) => {
  // Start on index 0 (Chainsaw Man - SPOTLIGHTS / 01)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const total = SPOTLIGHT_BOOKS.length;

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  // Auto rotate every 7 seconds when not hovered
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      handleNext();
    }, 7000);
    return () => clearInterval(timer);
  }, [isHovered, handleNext]);

  const activeItem = SPOTLIGHT_BOOKS[currentIndex];

  const handleSpotlightImgError = (e: React.SyntheticEvent<HTMLImageElement>, rawUrl: string, title?: string) => {
    const target = e.currentTarget;
    if (!target.dataset.triedProxy && rawUrl && rawUrl.startsWith('http') && !target.src.includes('/api/manga/image-proxy')) {
      target.dataset.triedProxy = 'true';
      const titleParam = title ? `&title=${encodeURIComponent(title)}` : '';
      target.src = `/api/manga/image-proxy?url=${encodeURIComponent(rawUrl)}${titleParam}`;
    }
  };

  // Helper to safely get item at offset relative to currentIndex
  const getItemAtOffset = (offset: number) => {
    const raw = (currentIndex + offset) % total;
    return SPOTLIGHT_BOOKS[raw < 0 ? raw + total : raw];
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[640px] sm:h-[700px] md:h-[780px] overflow-hidden select-none"
    >
      {/* High-Resolution Dynamic Background Banners - Hardware Accelerated */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none transform-gpu">
        {SPOTLIGHT_BOOKS.map((item, idx) => (
          <img
            key={item.id}
            src={item.bannerImage}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}


        {/* Seamless zero-jank edge gradients: melts into #0a0b0f smoothly */}
        {/* Top soft blend behind the floating navbar */}
        <div className="absolute inset-x-0 top-0 h-36 sm:h-44 bg-gradient-to-b from-[#0a0b0f] via-[#0a0b0f]/60 to-transparent z-20 pointer-events-none" />
        {/* Bottom smooth cinematic dissolve into website page */}
        <div className="absolute inset-x-0 bottom-0 h-72 sm:h-96 md:h-[420px] bg-gradient-to-t from-[#0a0b0f] via-[#0a0b0f]/85 to-transparent z-20 pointer-events-none" />
        {/* Left side vignette: ensures optimal contrast for left-aligned content */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 md:w-1/2 bg-gradient-to-r from-[#0a0b0f] via-[#0a0b0f]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 sm:w-32 bg-gradient-to-l from-[#0a0b0f]/60 to-transparent z-20 pointer-events-none" />
      </div>

      <div className="relative z-30 px-4 sm:px-8 md:px-12 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-10 flex flex-col justify-between h-full">
        {/* Top Headbar: — SPOTLIGHTS / 05  ...  10 TOTAL */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono tracking-widest text-zinc-400 uppercase">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#f76707] rounded-full inline-block" />
            <span className="text-zinc-300 font-bold">
              SPOTLIGHTS / {String(currentIndex + 1).padStart(2, '0')}
            </span>
          </div>
          <span className="text-zinc-400 font-semibold">{total} TOTAL</span>
        </div>

        {/* Cards Strip (Left-Aligned Covers without arrows) */}
        <div className="relative flex items-center justify-start my-4 sm:my-6 h-64 sm:h-72 md:h-80 lg:h-96 overflow-visible pl-2 sm:pl-4">
          <div className="relative flex items-center justify-start w-full max-w-4xl h-full">
            {/* Card Offset -1 (Previous - slightly peeking on left behind active card) */}
            {(() => {
              const item = getItemAtOffset(-1);
              const coverUrl = resolveCoverUrl(item.coverImage, item.title, item.category);
              return (
                <div
                  onClick={handlePrev}
                  title={`Previous: ${item.title}`}
                  className="hidden sm:block absolute -translate-x-6 md:-translate-x-8 w-36 sm:w-40 md:w-48 lg:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl opacity-40 hover:opacity-75 transition-all duration-500 cursor-pointer scale-90 z-10 select-none border border-white/10"
                >
                  <img
                    src={coverUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={e => handleSpotlightImgError(e, coverUrl)}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              );
            })()}

            {/* Active Card (Offset 0 - Front prominent card on the left) */}
            {(() => {
              const coverUrl = resolveCoverUrl(activeItem.coverImage, activeItem.title, activeItem.category);
              return (
                <div
                  onClick={() => onOpenBook(activeItem)}
                  className="relative z-20 w-44 sm:w-52 md:w-60 lg:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_35px_rgba(255,255,255,0.25)] ring-2 ring-white/90 hover:ring-white scale-100 transition-all duration-500 cursor-pointer group"
                >
                  <img
                    src={coverUrl}
                    alt={activeItem.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => handleSpotlightImgError(e, coverUrl)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })()}

            {/* Card Offset +1 (Next) */}
            {(() => {
              const item = getItemAtOffset(1);
              const coverUrl = resolveCoverUrl(item.coverImage, item.title, item.category);
              return (
                <div
                  onClick={() => setCurrentIndex((currentIndex + 1) % total)}
                  title={`Next: ${item.title}`}
                  className="absolute translate-x-[110px] sm:translate-x-[140px] md:translate-x-[170px] lg:translate-x-[200px] w-36 sm:w-40 md:w-48 lg:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl opacity-65 hover:opacity-90 transition-all duration-500 cursor-pointer scale-90 z-10 select-none border border-white/15"
                >
                  <img
                    src={coverUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={e => handleSpotlightImgError(e, coverUrl)}
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
              );
            })()}

            {/* Card Offset +2 (Upcoming) */}
            {(() => {
              const item = getItemAtOffset(2);
              const coverUrl = resolveCoverUrl(item.coverImage, item.title, item.category);
              return (
                <div
                  onClick={() => setCurrentIndex((currentIndex + 2) % total)}
                  title={`Up Next: ${item.title}`}
                  className="hidden sm:block absolute translate-x-[205px] sm:translate-x-[260px] md:translate-x-[315px] lg:translate-x-[370px] w-32 sm:w-36 md:w-44 lg:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl opacity-45 hover:opacity-75 transition-all duration-500 cursor-pointer scale-80 z-5 select-none border border-white/10"
                >
                  <img
                    src={coverUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={e => handleSpotlightImgError(e, coverUrl)}
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
              );
            })()}

            {/* Card Offset +3 (Further Upcoming) */}
            {(() => {
              const item = getItemAtOffset(3);
              const coverUrl = resolveCoverUrl(item.coverImage, item.title, item.category);
              return (
                <div
                  onClick={() => setCurrentIndex((currentIndex + 3) % total)}
                  title={`Up Next: ${item.title}`}
                  className="hidden md:block absolute translate-x-[290px] sm:translate-x-[365px] md:translate-x-[440px] lg:translate-x-[520px] w-28 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl opacity-25 hover:opacity-60 transition-all duration-500 cursor-pointer scale-75 z-0 select-none border border-white/10"
                >
                  <img
                    src={coverUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={e => handleSpotlightImgError(e, coverUrl)}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              );
            })()}
          </div>
        </div>

        {/* Bottom Metadata & Controls: Left Side Details + Right Side Action Buttons */}
        <div className="relative z-30 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4 sm:gap-6 pl-2 sm:pl-4">
          {/* Left Side: Watermark, Category Pill, Title, Subtitle */}
          <div className="relative flex flex-col items-start text-left space-y-2 max-w-2xl min-w-0">
            {/* Giant Dynamic Watermark Index Number behind left-aligned title */}
            <div className="absolute -top-10 sm:-top-14 left-0 -translate-x-4 text-[140px] sm:text-[190px] md:text-[240px] font-black text-white/[0.045] pointer-events-none select-none font-mono tracking-tighter leading-none -z-10">
              {String(currentIndex + 1).padStart(2, '0')}
            </div>

            {/* Pill Badge: • MANGA | ⭐ RATING - 8.3 | 8.1M VIEWS */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-bold tracking-wider text-zinc-300 shadow-sm">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full inline-block animate-pulse ${
                    activeItem.category === 'manga'
                      ? 'bg-[#f76707]'
                      : activeItem.category === 'manhwa'
                      ? 'bg-cyan-400'
                      : activeItem.category === 'lightnovel'
                      ? 'bg-blue-400'
                      : activeItem.category === 'webnovel'
                      ? 'bg-[#DA6569]'
                      : 'bg-rose-400'
                  }`}
                />
                <span className="text-white uppercase">{activeItem.badgeType}</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-amber-300">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                <span>RATING — {activeItem.displayRating}</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{activeItem.views}</span>
            </div>

            {/* Large Title - Locked height container prevents layout jumping on multi-line titles */}
            <div className="h-14 sm:h-16 md:h-20 flex items-center">
              <h2
                className={`font-black text-white tracking-tight leading-tight line-clamp-2 ${
                  activeItem.title.length > 25
                    ? 'text-2xl sm:text-3xl md:text-4xl'
                    : 'text-2xl sm:text-3xl md:text-5xl'
                }`}
              >
                {activeItem.title}
              </h2>
            </div>

            {/* Subtitle / Category Description */}
            <p className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-widest uppercase">
              {activeItem.badgeType} — {activeItem.updateStatus}
            </p>
          </div>

          {/* Right Side: CTA Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-end pb-1 pr-2 sm:pr-4">
            <button
              onClick={() => onOpenBook(activeItem)}
              className="flex items-center gap-2.5 px-7 sm:px-9 py-2.5 sm:py-3.5 rounded-full bg-[#DA6569] hover:bg-[#c95458] text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-[#DA6569]/35 hover:shadow-[#DA6569]/55 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 stroke-[2.5]" />
              <span>READ NOW</span>
            </button>

            {onExploreCatalogue && (
              <button
                onClick={onExploreCatalogue}
                className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 hover:border-white/35 text-white font-bold text-xs sm:text-sm active:scale-95 transition-all duration-200 backdrop-blur-md shadow-sm cursor-pointer"
              >
                <span>EXPLORE</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SpotlightHero = React.memo(SpotlightHeroComponent);
