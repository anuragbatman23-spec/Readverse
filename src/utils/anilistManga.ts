import { Book } from '@/types';

export interface AniListMangaResult {
  id: string; // e.g. "anilist-86848"
  title: string;
  author: string;
  category: 'manga' | 'manhwa';
  coverImage: string;
  description: string;
  genre: string[];
  rating: number;
  totalChapters?: number;
  countryOfOrigin?: string;
}

const ANILIST_QUERY = `
  query ($search: String, $isAdult: Boolean) {
    Page(page: 1, perPage: 10) {
      media(search: $search, type: MANGA, isAdult: $isAdult) {
        id
        title {
          romaji
          english
          native
        }
        staff(perPage: 3) {
          edges {
            role
            node {
              name {
                full
              }
            }
          }
        }
        coverImage {
          extraLarge
          large
          medium
        }
        bannerImage
        description
        format
        countryOfOrigin
        genres
        averageScore
        chapters
      }
    }
  }
`;

export async function searchAniListManga(
  query: string,
  categoryFilter: string = 'all'
): Promise<Book[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const isLikelyAdult =
    /secret class|boarding diary|silent war|circles|sweet guy|pervert|bad thinking|stepmother|touch to unlock|jinx|bj alex|painter of the night|pearl boy|hentai|ecchi|adult/i.test(
      cleanQ
    );

  const fetchAdult = isLikelyAdult ? [true, false] : [false];

  const results: Book[] = [];
  const seenIds = new Set<string>();

  for (const isAdult of fetchAdult) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          query: ANILIST_QUERY,
          variables: { search: cleanQ, isAdult }
        }),
        signal: controller.signal,
        next: { revalidate: 3600 }
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const mediaList = data.data?.Page?.media || [];

      for (const m of mediaList) {
        const strId = `anilist-${m.id}`;
        if (seenIds.has(strId)) continue;
        seenIds.add(strId);

        const title = m.title?.english || m.title?.romaji || m.title?.native || 'Untitled Manga';
        const origCountry = (m.countryOfOrigin || '').toUpperCase();
        const format = (m.format || '').toUpperCase();
        const genres: string[] = Array.isArray(m.genres) ? m.genres : [];

        const isManhwa =
          origCountry === 'KR' ||
          format === 'MANHWA' ||
          genres.some(g => /manhwa|webtoon/i.test(g)) ||
          /manhwa|webtoon|solo|tower|god|viewpoint|leveling/i.test(title);

        if (categoryFilter === 'manhwa' && !isManhwa) continue;
        if (categoryFilter === 'manga' && isManhwa) continue;

        // Author/artist extraction
        const staffEdges = m.staff?.edges || [];
        const authorEdge = staffEdges.find((e: { role?: string; node?: { name?: { full?: string } } }) =>
          /story|author|creator|original/i.test(e.role || '')
        );
        const artistEdge = staffEdges.find((e: { role?: string; node?: { name?: { full?: string } } }) =>
          /art|illustrator|artist/i.test(e.role || '')
        );
        const author =
          authorEdge?.node?.name?.full ||
          artistEdge?.node?.name?.full ||
          staffEdges[0]?.node?.name?.full ||
          (isManhwa ? 'Korean Studio' : 'Manga Author');

        const coverImage =
          m.coverImage?.extraLarge ||
          m.coverImage?.large ||
          m.coverImage?.medium ||
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80';

        const rawDesc = m.description || '';
        const cleanDesc = rawDesc
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .slice(0, 300);

        const rating = m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : 4.8;

        results.push({
          id: strId,
          title,
          author,
          category: isManhwa ? 'manhwa' : 'manga',
          coverImage,
          description: cleanDesc || `${title} — Official catalog series available on ReadVerse.`,
          genre: genres.slice(0, 3),
          rating,
          pointsPerChapter: isManhwa ? 1.5 : 1.0,
          chapters: []
        });
      }
    } catch (err) {
      console.warn('AniList search error:', err);
    }
  }

  return results;
}
