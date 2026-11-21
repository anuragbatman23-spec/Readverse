export interface MangaDistrictChapter {
  id: string; // e.g. "md-ch:solo-leveling:chapter-200"
  title: string;
  chapterNumber: number;
  content: string[];
}

export interface MangaDistrictSeries {
  id: string; // e.g. "md-solo-leveling"
  slug: string;
  title: string;
  coverImage: string;
  isManhwa: boolean;
  description?: string;
}

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Searches MangaDistrict for manga and manhwa titles
 */
export async function searchMangaDistrict(query: string): Promise<MangaDistrictSeries[]> {
  try {
    const rawClean = (query || '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/[\-:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!rawClean) return [];

    const candidates = [rawClean];
    // If multiple words, also try the first 2 words as fallback
    const words = rawClean.split(' ');
    if (words.length > 2) {
      candidates.push(words.slice(0, 2).join(' '));
    }

    const results: MangaDistrictSeries[] = [];
    const seen = new Set<string>();

    for (const term of candidates) {
      if (results.length > 0) break;

      const url = `https://mangadistrict.com/?s=${encodeURIComponent(term)}&post_type=wp-manga`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT
        },
        cache: 'no-store'
      });

      if (!res.ok) continue;

      const html = await res.text();

      // 1. Primary: Block parsing by "page-item-detail"
      const blocks = html.split(/class="[^"]*page-item-detail[^"]*"/).slice(1);
      for (const block of blocks) {
        const slugMatch = block.match(/href="https?:\/\/mangadistrict\.com\/series\/([^/"]+)\/?"/);
        if (!slugMatch) continue;
        const slug = slugMatch[1].trim();
        if (seen.has(slug) || slug === 'feed' || slug === 'series') continue;

        const titleMatch = block.match(/<h[345][^>]*>\s*<a[^>]*>([^<]+)<\/a>/i) || block.match(/title="([^"]+)"/);
        const imgMatch = block.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i);

        const rawTitle = titleMatch
          ? titleMatch[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&#8217;/g, "'").trim()
          : slug.replace(/-/g, ' ');
        let coverImage = imgMatch ? imgMatch[1].trim() : '';
        if (coverImage.startsWith('/')) {
          coverImage = `https://mangadistrict.com${coverImage}`;
        }

        seen.add(slug);
        const isManhwa =
          /manhwa|webtoon|solo leveling|lookism|tower of god|return|regress|reborn|level|cultivat|player|ranker|hero/i.test(
            slug + ' ' + rawTitle
          );

        results.push({
          id: `md-${slug}`,
          slug,
          title: rawTitle,
          coverImage,
          isManhwa
        });
      }

      // 2. Fallback: Direct regex matching
      if (results.length === 0) {
        const regex = /<a\s+href="https?:\/\/mangadistrict\.com\/series\/([^/"]+)\/"[^>]*title="([^"]*)"[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"/g;
        const matches = Array.from(html.matchAll(regex));
        for (const m of matches) {
          const slug = m[1].trim();
          if (seen.has(slug) || slug === 'feed' || slug === 'series') continue;
          seen.add(slug);

          const title = m[2].replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&#8217;/g, "'").trim();
          let coverImage = m[3].trim();
          if (coverImage.startsWith('/')) {
            coverImage = `https://mangadistrict.com${coverImage}`;
          }

          results.push({
            id: `md-${slug}`,
            slug,
            title,
            coverImage,
            isManhwa: true
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('MangaDistrict search error:', err);
    return [];
  }
}

/**
 * Fetches all chapters of a MangaDistrict series (supports standard and multi-volume series)
 */
export async function getMangaDistrictChapters(seriesIdOrSlug: string): Promise<MangaDistrictChapter[]> {
  try {
    const slug = seriesIdOrSlug.replace(/^md-/, '');

    // 1. Try AJAX chapters endpoint (Madara theme)
    const ajaxUrl = `https://mangadistrict.com/series/${slug}/ajax/chapters/`;
    let res = await fetch(ajaxUrl, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 1800 }
    });

    let html = '';
    if (res.ok) {
      html = await res.text();
    }

    // Fallback: If AJAX failed or returned empty, fetch main series page
    if (!html || !html.includes('wp-manga-chapter')) {
      const mainRes = await fetch(`https://mangadistrict.com/series/${slug}/`, {
        headers: {
          'User-Agent': USER_AGENT
        },
        next: { revalidate: 1800 }
      });
      if (mainRes.ok) {
        html = await mainRes.text();
      }
    }

    if (!html) return [];

    // Match all chapter anchors inside .wp-manga-chapter elements (supports nested volume lists)
    const chapterRegex = /<li[^>]*class="[^"]*wp-manga-chapter[^"]*"[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const matches = Array.from(html.matchAll(chapterRegex));

    const chapters: MangaDistrictChapter[] = [];
    const seenNum = new Set<number>();
    const seenSubpath = new Set<string>();

    for (const m of matches) {
      const fullHref = m[1].trim();
      const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();

      // Extract subpath after /series/{slug}/
      const prefix = `https://mangadistrict.com/series/${slug}/`;
      let subPath = fullHref;
      if (subPath.startsWith(prefix)) {
        subPath = subPath.substring(prefix.length).replace(/\/$/, '');
      } else {
        const match = fullHref.match(/\/series\/[^/]+\/(.+?)\/?$/);
        if (match) subPath = match[1];
      }

      if (!subPath || seenSubpath.has(subPath)) continue;
      seenSubpath.add(subPath);

      // Extract chapter number
      const numMatch = rawTitle.match(/(\d+(?:[._]\d+)?)/) || subPath.match(/chapter-(\d+(?:[._]\d+)?)/i);
      const num = numMatch ? parseFloat(numMatch[1].replace('_', '.')) : 0;

      // Skip duplicate volume copies (e.g. V1 vs V2 of the same chapter number)
      if (seenNum.has(num)) continue;
      seenNum.add(num);

      chapters.push({
        id: `md-ch:${slug}:${encodeURIComponent(subPath)}`,
        title: rawTitle || `Chapter ${num}`,
        chapterNumber: num,
        content: []
      });
    }

    // Fallback: simple <a> link parsing if .wp-manga-chapter was missing
    if (chapters.length === 0) {
      const simpleRegex = /<a\s+href="https?:\/\/mangadistrict\.com\/series\/[^/"]+\/([^/"]+)\/?"[^>]*>([\s\S]*?)<\/a>/g;
      const simpleMatches = Array.from(html.matchAll(simpleRegex));
      for (const m of simpleMatches) {
        const chSlug = m[1].trim();
        if (seenSubpath.has(chSlug) || chSlug === '' || chSlug === 'series' || chSlug === 'feed') continue;
        seenSubpath.add(chSlug);

        const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();
        const numMatch = chSlug.match(/(\d+(?:[-.]\d+)?)/) || rawTitle.match(/(\d+(?:[.]\d+)?)/);
        const num = numMatch ? parseFloat(numMatch[1].replace('-', '.')) : 0;

        chapters.push({
          id: `md-ch:${slug}:${encodeURIComponent(chSlug)}`,
          title: rawTitle || `Chapter ${num}`,
          chapterNumber: num,
          content: []
        });
      }
    }

    // Sort ascending by chapterNumber
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    return chapters;
  } catch (err) {
    console.warn('MangaDistrict getChapters error:', err);
    return [];
  }
}

/**
 * Fetches all page image URLs for a MangaDistrict chapter
 */
export async function getMangaDistrictPages(chapterId: string): Promise<string[]> {
  try {
    // chapterId format: md-ch:{slug}:{encodedSubPath} or legacy md-ch-{slug}-{chapterNum}
    let slug = '';
    let subPath = '';

    if (chapterId.includes(':')) {
      const parts = chapterId.split(':');
      slug = parts[1];
      subPath = decodeURIComponent(parts[2]);
    } else {
      const clean = chapterId.replace(/^md-(?:ch-)?/, '');
      const lastDash = clean.lastIndexOf('-');
      if (lastDash === -1) return [];
      slug = clean.substring(0, lastDash);
      subPath = `chapter-${clean.substring(lastDash + 1)}`;
    }

    if (!slug || !subPath) return [];

    const url = `https://mangadistrict.com/series/${slug}/${subPath}/`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT
      },
      next: { revalidate: 86400 }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const matches = Array.from(
      html.matchAll(/class="page-break[^"]*">[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"/g)
    ).map(m => m[1]);

    const pages: string[] = [];
    const seen = new Set<string>();

    for (const img of matches) {
      if (
        !img.startsWith('data:') &&
        !img.includes('assets/publication/media') &&
        img.includes('mangadistrict.com') &&
        !seen.has(img)
      ) {
        seen.add(img);
        pages.push(img);
      }
    }

    return pages;
  } catch (err) {
    console.warn('MangaDistrict getPages error:', err);
    return [];
  }
}
