import { NextResponse } from 'next/server';
import { Book, ContentCategory } from '@/types';
import {
  getCuratedNonHomeRecommendations,
  normalizeTitle,
  getSourceName
} from '@/utils/puterRecommendationEngine';

export const dynamic = 'force-dynamic';

interface AniListMedia {
  id: number;
  title?: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  countryOfOrigin?: string;
  format?: string;
  coverImage?: {
    extraLarge?: string;
    large?: string;
    medium?: string;
  };
  description?: string;
  genres?: string[];
  averageScore?: number;
}

interface AniListResponse {
  data?: {
    Media?: {
      id: number;
      title?: {
        english?: string;
        romaji?: string;
      };
      countryOfOrigin?: string;
      format?: string;
      relations?: {
        edges?: Array<{
          relationType?: string;
          node?: AniListMedia;
        }>;
      };
      recommendations?: {
        nodes?: Array<{
          mediaRecommendation?: AniListMedia;
        }>;
      };
    };
  };
}

export interface RecommendedBookItem {
  book: Book;
  matchScore: number;
  highlightReason?: string;
}

function cleanHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('title') || searchParams.get('query') || '';
    const category = (searchParams.get('category') as ContentCategory) || 'manhwa';

    if (!query.trim()) {
      return NextResponse.json({
        recommendations: { manhwa: [], manga: [], lightnovel: [], webnovel: [], book: [] },
        totalCount: 0,
        source: 'empty'
      });
    }

    const cleanQuery = query.trim();

    // 1. Fetch live community recommendations from AniList GraphQL
    const anilistQuery = `
      query GetMediaRecs($search: String) {
        Media(search: $search, type: MANGA) {
          id
          title { english romaji }
          countryOfOrigin
          format
          relations {
            edges {
              relationType
              node {
                id
                title { english romaji }
                countryOfOrigin
                format
                coverImage { extraLarge large }
                description
                genres
                averageScore
              }
            }
          }
          recommendations(sort: RATING_DESC, perPage: 25) {
            nodes {
              mediaRecommendation {
                id
                title { english romaji }
                countryOfOrigin
                format
                coverImage { extraLarge large }
                description
                genres
                averageScore
              }
            }
          }
        }
      }
    `;

    let anilistMedia: AniListResponse['data'] = undefined;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'ReadVerse/1.0'
        },
        body: JSON.stringify({
          query: anilistQuery,
          variables: { search: cleanQuery }
        })
      });

      if (res.ok) {
        const json = await res.json();
        anilistMedia = json.data;
      }
    } catch (err) {
      console.warn('AniList live recommendations fetch failed:', err);
    }

    const categorized: Record<ContentCategory, RecommendedBookItem[]> = {
      manhwa: [],
      manga: [],
      lightnovel: [],
      webnovel: [],
      book: []
    };

    const seenIds = new Set<string>();
    const seenTitles = new Set<string>([normalizeTitle(cleanQuery)]);

    // Helper to add candidate to appropriate category
    const addCandidate = (
      media: AniListMedia,
      reason: string,
      forcedCategory?: ContentCategory
    ) => {
      if (!media || !media.title) return;
      const invalidFormats = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'];
      if (media.format && invalidFormats.includes(media.format.toUpperCase())) {
        return;
      }

      const title = (media.title.english || media.title.romaji || '').trim();
      if (!title) return;

      const normTitle = normalizeTitle(title);
      if (seenTitles.has(normTitle)) return;
      seenTitles.add(normTitle);

      // Determine category
      let cat: ContentCategory = forcedCategory || 'manga';
      if (!forcedCategory) {
        if (media.format === 'NOVEL') {
          cat = 'lightnovel';
        } else if (media.countryOfOrigin === 'KR' || /manhwa|webtoon/i.test(title)) {
          cat = 'manhwa';
        } else if (media.countryOfOrigin === 'CN') {
          cat = 'manhwa';
        } else if (media.countryOfOrigin === 'JP') {
          cat = 'manga';
        }
      }

      const bookId = `rec-anilist-${media.id}`;
      if (seenIds.has(bookId)) return;
      seenIds.add(bookId);

      const cover =
        media.coverImage?.extraLarge ||
        media.coverImage?.large ||
        'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx109675-e1i5bqAZjGQ4.jpg';

      const desc =
        cleanHtml(media.description) ||
        `Acclaimed series for readers of ${cleanQuery}.`;

      const rating = media.averageScore
        ? Number((media.averageScore / 10).toFixed(1))
        : 8.8;

      const genres = media.genres?.length ? media.genres : ['Action', 'Fantasy'];

      const bookItem: Book = {
        id: bookId,
        title,
        author: cat === 'manhwa' ? 'Studio Redice' : 'Manga Creator',
        category: cat,
        coverImage: cover,
        description: desc,
        genre: genres,
        rating,
        pointsPerChapter: 1.5,
        chapters: []
      };

      if (categorized[cat].length < 10) {
        categorized[cat].push({
          book: bookItem,
          matchScore: media.averageScore || 85,
          highlightReason: `Source: ${getSourceName(bookItem)}`
        });
      }
    };

    // Process AniList Relations
    const media = anilistMedia?.Media;
    if (media) {
      const relations = media.relations?.edges || [];
      for (const rel of relations) {
        const node = rel.node;
        if (!node) continue;
        if (rel.relationType === 'SOURCE' || rel.relationType === 'ADAPTATION') {
          const reason =
            rel.relationType === 'SOURCE'
              ? 'Original Source Material'
              : 'Official Adaptation';
          addCandidate(node, reason);
        }
      }

      // Process AniList Community-Voted Recommendations
      const recNodes = media.recommendations?.nodes || [];
      let rank = 1;
      for (const node of recNodes) {
        const rec = node.mediaRecommendation;
        if (!rec) continue;

        let reason = `AniList Community Pick #${rank}`;
        if (rank === 1) {
          reason = `Top Choice for ${cleanQuery} Readers`;
        } else if (rec.genres && rec.genres.length > 0) {
          reason = `Shares ${rec.genres.slice(0, 2).join(' & ')}`;
        }

        addCandidate(rec, reason);
        rank++;
      }
    }

    // 2. Hybrid Augmentation: Backfill up to 10 books using curated non-home pool
    const targetPlaceholder: Book = {
      id: `query-${cleanQuery}`,
      title: cleanQuery,
      category,
      author: 'Author',
      coverImage: '',
      description: cleanHtml(media?.recommendations?.nodes?.[0]?.mediaRecommendation?.description) || '',
      genre: media?.recommendations?.nodes?.[0]?.mediaRecommendation?.genres || [],
      rating: 9.0,
      pointsPerChapter: 1.5,
      chapters: []
    };

    const curatedRecs = getCuratedNonHomeRecommendations(targetPlaceholder);

    const categoriesList: ContentCategory[] = ['manhwa', 'manga', 'lightnovel', 'webnovel', 'book'];
    categoriesList.forEach(catKey => {
      const fallbackList = curatedRecs.recommendations[catKey] || [];
      for (const item of fallbackList) {
        if (categorized[catKey].length >= 10) break;
        const norm = normalizeTitle(item.book.title);
        if (!seenTitles.has(norm)) {
          seenTitles.add(norm);
          categorized[catKey].push({
            book: item.book,
            matchScore: 90,
            highlightReason: item.reason || 'Curated Reading Companion'
          });
        }
      }
    });

    const totalCount = Object.values(categorized).reduce((sum, list) => sum + list.length, 0);

    const payload = {
      recommendations: categorized,
      totalCount,
      source: media ? 'anilist-live' : 'curated-nonhome-engine'
    };

    return NextResponse.json(payload);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Recommendations API error:', errorMsg);
    return NextResponse.json(
      {
        recommendations: { manhwa: [], manga: [], lightnovel: [], webnovel: [], book: [] },
        totalCount: 0,
        source: 'error',
        error: errorMsg
      },
      { status: 500 }
    );
  }
}
