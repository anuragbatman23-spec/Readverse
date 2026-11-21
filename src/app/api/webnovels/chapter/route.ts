import { NextResponse } from 'next/server';
import { getLNWebnovelChapterContent } from '@/utils/lnreaderService';
import { findLocalLightNovel } from '@/utils/localLightNovelsService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pluginId = searchParams.get('pluginId') || 'novelbuddy';
  const path = searchParams.get('path');
  const bookId = searchParams.get('bookId') || '';
  const title = searchParams.get('title') || '';
  const chapterIndexParam = searchParams.get('chapterIndex') || searchParams.get('chapter');
  const chapterIndex = chapterIndexParam !== null ? parseInt(chapterIndexParam, 10) : 0;

  if (!path && !bookId && !title) {
    return NextResponse.json({ error: 'Chapter path or book identifier is required' }, { status: 400 });
  }

  // 1. If path is a real remote webnovel chapter path, try loading online with timeout
  if (path && !path.startsWith('ln-ch-') && !path.startsWith('local-')) {
    try {
      const chapterData = await Promise.race([
        getLNWebnovelChapterContent(pluginId, path),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Online source timeout')), 3500))
      ]);
      if (chapterData && chapterData.content && chapterData.content.length > 0) {
        return NextResponse.json({
          content: chapterData.content,
          wordCount: chapterData.wordCount
        });
      }
    } catch (err: unknown) {
      console.warn(`Online source ${pluginId} failed or timed out for chapter ${path}, checking local storage fallback:`, err);
    }
  }

  // 2. Offline fallback: load from locally stored light novel
  try {
    const localMatch = await findLocalLightNovel(title || bookId || path || '', title, bookId);
    if (localMatch && localMatch.chapters && localMatch.chapters.length > 0) {
      // Find chapter by index or by path matching chapter ID
      let targetChapter = localMatch.chapters.find(c => c.id === path || c.path === path);
      if (!targetChapter && !isNaN(chapterIndex) && chapterIndex >= 0 && chapterIndex < localMatch.chapters.length) {
        targetChapter = localMatch.chapters[chapterIndex];
      }
      if (!targetChapter && localMatch.chapters.length > 0) {
        targetChapter = localMatch.chapters[0];
      }

      if (targetChapter && targetChapter.content && targetChapter.content.length > 0) {
        return NextResponse.json({
          content: targetChapter.content,
          wordCount: targetChapter.wordCount || 1500,
          fromLocal: true
        });
      }
    }
  } catch (localErr) {
    console.warn('Local fallback in /api/webnovels/chapter error:', localErr);
  }

  return NextResponse.json({ error: 'Could not stream chapter text from source or local storage' }, { status: 500 });
}
