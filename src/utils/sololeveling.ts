export interface SoloLevelingChapter {
  id: string; // e.g. "sl-ch-1"
  title: string;
  chapterNumber: number;
  content: string[];
}

const TOTAL_SOLO_LEVELING_CHAPTERS = 200;

/**
 * Extracts authentic vertical manhwa strip panels for a specific Solo Leveling chapter
 */
export async function getSoloLevelingPages(chapterIdOrNum: string | number): Promise<string[]> {
  try {
    let chNum = 1;
    if (typeof chapterIdOrNum === 'number') {
      chNum = chapterIdOrNum;
    } else {
      const match = chapterIdOrNum.match(/(\d+)/);
      chNum = match ? parseInt(match[1], 10) : 1;
    }

    if (chNum < 1 || chNum > TOTAL_SOLO_LEVELING_CHAPTERS) {
      return [];
    }

    const chapterUrl = `https://readsololeveling.org/chapter/solo-leveling-chapter-${chNum}/`;
    const res = await fetch(chapterUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow',
      next: { revalidate: 86400 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const rawMatches = Array.from(html.matchAll(/src="([^"]*cdn\.readsololeveling\.org\/file\/[^"]*)"/g)).map(m => m[1]);

    // Deduplicate identical sequential images
    const seen = new Set<string>();
    const pages: string[] = [];

    for (const imgUrl of rawMatches) {
      if (!seen.has(imgUrl)) {
        seen.add(imgUrl);
        pages.push(`/api/manga/image-proxy?url=${encodeURIComponent(imgUrl)}`);
      }
    }

    return pages;
  } catch (err) {
    console.warn('Solo Leveling get pages error:', err);
    return [];
  }
}

/**
 * Returns all 200 Solo Leveling chapters, pre-fetching Chapter 1's authentic pages
 */
export async function getSoloLevelingChapters(): Promise<SoloLevelingChapter[]> {
  const chapters: SoloLevelingChapter[] = [];

  for (let ep = 1; ep <= TOTAL_SOLO_LEVELING_CHAPTERS; ep++) {
    chapters.push({
      id: `sl-ch-${ep}`,
      title: ep <= 179 ? `Chapter ${ep}` : `Side Story ${ep - 179}`,
      chapterNumber: ep,
      content: []
    });
  }

  // Pre-load Chapter 1 pages so the reader opens instantaneously
  try {
    const firstPages = await getSoloLevelingPages(1);
    if (firstPages.length > 0) {
      chapters[0].content = firstPages;
    }
  } catch (err) {
    console.warn('Failed to pre-fetch Solo Leveling ch 1:', err);
  }

  return chapters;
}
