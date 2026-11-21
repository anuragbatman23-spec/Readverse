import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LOCAL_FALLBACKS = [
  { url: '/spotlights/orv.webp', width: 1920, height: 1080 },
  { url: '/spotlights/solo-leveling.webp', width: 1920, height: 1080 },
  { url: '/spotlights/chainsaw-man.webp', width: 1920, height: 1080 },
  { url: '/spotlights/berserk.webp', width: 1920, height: 1080 },
  { url: '/spotlights/frieren.webp', width: 1920, height: 1080 },
  { url: '/spotlights/jujutsu-kaisen.webp', width: 1920, height: 1080 },
  { url: '/spotlights/one-piece.webp', width: 1920, height: 1080 },
  { url: '/spotlights/slime.webp', width: 1920, height: 1080 },
  { url: '/spotlights/shadow-slave.webp', width: 1920, height: 1080 },
  { url: '/spotlights/eminence-in-shadow.webp', width: 1920, height: 1080 },
  { url: '/spotlights/classroom-of-the-elite.webp', width: 2000, height: 1200 }
];

// Helper: Fetch horizontal image from pic.re
async function fetchPicRe() {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch('https://pic.re/image.json', {
        headers: { 'User-Agent': 'ReadVerse/1.0 (contact@readverse.app)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const d = await res.json();
        // Strictly horizontal (aspect ratio >= 1.15) and min 1200px width so it never blurs
        if (d.width && d.height && d.width >= d.height * 1.15 && d.width >= 1200) {
          const url = d.file_url.startsWith('http') ? d.file_url : 'https://' + d.file_url;
          return {
            url,
            source: 'pic.re',
            width: d.width,
            height: d.height,
            author: d.author || null
          };
        }
      }
    } catch {
      // Continue to next attempt
    }
  }
  return null;
}

// Helper: Fetch horizontal image from nekosia.cat
async function fetchNekosia() {
  const categories = ['catgirl', 'cute', 'maid'];
  for (const cat of categories) {
    try {
      const res = await fetch(`https://api.nekosia.cat/api/v1/images/${cat}`, {
        headers: { 'User-Agent': 'ReadVerse/1.0 (contact@readverse.app)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const d = await res.json();
        const w = d.metadata?.original?.width || d.metadata?.compressed?.width;
        const h = d.metadata?.original?.height || d.metadata?.compressed?.height;
        const url = d.image?.original?.url || d.image?.compressed?.url;
        // Strictly horizontal and high-res
        if (w && h && w >= h * 1.15 && w >= 1200 && url) {
          return {
            url,
            source: 'nekosia.cat',
            width: w,
            height: h,
            author: d.attribution?.artist?.username || null
          };
        }
      }
    } catch {
      // Continue
    }
  }
  return null;
}

// Helper: Fetch horizontal image from nekos.best
async function fetchNekosBest() {
  const categories = ['kitsune', 'waifu', 'neko', 'husbando'];
  for (const cat of categories) {
    try {
      const res = await fetch(`https://nekos.best/api/v2/${cat}?amount=20`, {
        headers: { 'User-Agent': 'ReadVerseApp/1.0 (contact@readverse.app)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const d = await res.json();
        const match = d.results?.find(
          (r: { dimensions?: { width: number; height: number }; url: string; artist_name?: string }) =>
            r.dimensions && r.dimensions.width >= r.dimensions.height * 1.15 && r.dimensions.width >= 1200
        );
        if (match) {
          return {
            url: match.url,
            source: 'nekos.best',
            width: match.dimensions.width,
            height: match.dimensions.height,
            author: match.artist_name || null
          };
        }
      }
    } catch {
      // Continue
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const preferredSource = searchParams.get('source');

  // If specific source is requested, try that first
  if (preferredSource === 'pic.re') {
    const res = await fetchPicRe();
    if (res) return NextResponse.json(res);
  } else if (preferredSource === 'nekosia') {
    const res = await fetchNekosia();
    if (res) return NextResponse.json(res);
  } else if (preferredSource === 'nekos.best') {
    const res = await fetchNekosBest();
    if (res) return NextResponse.json(res);
  }

  // Shuffle providers for fair rotation
  const providers = [fetchPicRe, fetchNekosia, fetchNekosBest];
  providers.sort(() => Math.random() - 0.5);

  for (const getProviderWallpaper of providers) {
    try {
      const result = await getProviderWallpaper();
      if (result) {
        return NextResponse.json(result);
      }
    } catch {
      // Try next provider
    }
  }

  // Fallback try with pic.re
  const picReFallback = await fetchPicRe();
  if (picReFallback) return NextResponse.json(picReFallback);

  // Local fallback: guaranteed horizontal 1080p anime landscape
  const local = LOCAL_FALLBACKS[Math.floor(Math.random() * LOCAL_FALLBACKS.length)];
  return NextResponse.json({
    url: local.url,
    source: 'spotlight-local',
    width: local.width,
    height: local.height
  });
}
