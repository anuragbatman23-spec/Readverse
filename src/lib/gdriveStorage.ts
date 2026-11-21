import { queryD1, executeD1 } from './d1Client';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';
import { Book, Chapter } from '@/types';

export interface AdminDriveConfig {
  refreshToken: string;
  folderId: string;
  email: string;
  connectedAt?: string;
}

const DEFAULT_ADMIN_FOLDER_ID = '1fX2VjFzl1aP-pOHwsCk2FDU3Ksf-JzOz';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// In-memory token cache
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Retrieve admin Google Drive configuration from D1 storage or environment
 */
export async function getAdminDriveConfig(): Promise<AdminDriveConfig | null> {
  // 1. Check Cloudflare D1 storage_objects
  try {
    const rows = await queryD1<{ data: string }>(
      'SELECT data FROM storage_objects WHERE key = ? LIMIT 1',
      ['gdrive_admin_config']
    );
    if (rows && rows.length > 0 && rows[0].data) {
      const parsed = JSON.parse(rows[0].data);
      if (parsed?.refreshToken) {
        return {
          refreshToken: parsed.refreshToken,
          folderId: parsed.folderId || DEFAULT_ADMIN_FOLDER_ID,
          email: parsed.email || 'admin',
          connectedAt: parsed.connectedAt
        };
      }
    }
  } catch (err) {
    console.warn('[GDrive] Could not read admin config from D1:', err);
  }

  // 2. Fallback to process.env
  if (process.env.GDRIVE_ADMIN_REFRESH_TOKEN) {
    return {
      refreshToken: process.env.GDRIVE_ADMIN_REFRESH_TOKEN,
      folderId: process.env.GDRIVE_ADMIN_FOLDER_ID || DEFAULT_ADMIN_FOLDER_ID,
      email: 'admin'
    };
  }

  return null;
}

/**
 * Persist admin Google Drive refresh token & folder to Cloudflare D1
 */
export async function saveAdminDriveConfig(config: AdminDriveConfig): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      ...config,
      folderId: config.folderId || DEFAULT_ADMIN_FOLDER_ID,
      connectedAt: new Date().toISOString()
    });
    const sizeBytes = Buffer.byteLength(payload, 'utf-8');

    await executeD1(
      `INSERT INTO storage_objects (key, content_type, data, size_bytes)
       VALUES ('gdrive_admin_config', 'application/json', ?, ?)
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, size_bytes = excluded.size_bytes`,
      [payload, sizeBytes]
    );
    console.log('[GDrive] Admin Drive configuration saved successfully in Cloudflare D1.');
    return true;
  } catch (err) {
    console.error('[GDrive] Failed to save admin Drive config:', err);
    return false;
  }
}

/**
 * Exchange admin refresh token for a fresh short-lived Google Drive access token
 */
export async function getAdminDriveAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && now < tokenExpiresAt - 60) {
    return cachedAccessToken;
  }

  const config = await getAdminDriveConfig();
  if (!config?.refreshToken) {
    throw new Error('Google Drive Admin storage is not connected yet. Please sign in with Google as admin to connect.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token'
    }),
    cache: 'no-store'
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google token refresh failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in || 3600);
  return cachedAccessToken!;
}

/**
 * Upload an EPUB buffer into the admin's Google Drive folder
 */
export async function uploadEpubToAdminDrive(params: {
  filename: string;
  buffer: Buffer;
  mimeType?: string;
}): Promise<{ fileId: string; name: string; size?: number; webViewLink?: string }> {
  const accessToken = await getAdminDriveAccessToken();
  const config = await getAdminDriveConfig();
  const folderId = config?.folderId || DEFAULT_ADMIN_FOLDER_ID;

  const metadata = {
    name: params.filename,
    parents: [folderId],
    description: 'Uploaded custom book on ReadVerse'
  };

  const boundary = `-------readverse_gdrive_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  const contentType = params.mimeType || 'application/epub+zip';

  const multipartBody = Buffer.concat([
    Buffer.from(
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}${delimiter}Content-Type: ${contentType}\r\n\r\n`
    ),
    params.buffer,
    Buffer.from(closeDelimiter)
  ]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody,
      cache: 'no-store'
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Google Drive upload failed (${uploadRes.status}): ${errorText}`);
  }

  const data = await uploadRes.json();
  return {
    fileId: data.id,
    name: data.name,
    size: data.size ? parseInt(data.size, 10) : params.buffer.length,
    webViewLink: data.webViewLink
  };
}

/**
 * Download / stream an EPUB binary from admin's Google Drive folder by fileId
 */
export async function downloadEpubFromAdminDrive(fileId: string): Promise<{ buffer: Buffer; contentType: string }> {
  const accessToken = await getAdminDriveAccessToken();

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive download failed for file ${fileId} (${res.status}): ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get('content-type') || 'application/epub+zip'
  };
}

/**
 * List files stored in the admin's Google Drive folder
 */
export async function listAdminDriveEpubs(): Promise<Array<{ id: string; name: string; size?: number }>> {
  try {
    const accessToken = await getAdminDriveAccessToken();
    const config = await getAdminDriveConfig();
    const folderId = config?.folderId || DEFAULT_ADMIN_FOLDER_ID;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false&fields=files(id,name,size,mimeType)&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store'
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      size: f.size ? parseInt(f.size, 10) : undefined
    }));
  } catch (err) {
    console.warn('[GDrive] listAdminDriveEpubs error:', err);
    return [];
  }
}

/**
 * Extract book metadata (title, author, chapter count) from an in-memory EPUB buffer
 */
export async function parseEpubBufferMetadata(fileBuffer: Buffer, filename: string): Promise<Book> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const containerFile = zip.file('META-INF/container.xml');
  let opfPath = 'OEBPS/content.opf';
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const match = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (match) opfPath = match[1];
  }

  const opfFile = zip.file(opfPath);
  let title = filename.replace(/\.epub$/i, '').replace(/_/g, ' ');
  let author = 'Custom Author';
  let chaptersCount = 1;

  if (opfFile) {
    const opfXml = await opfFile.async('text');
    const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    if (titleMatch) title = titleMatch[1].trim();
    const authorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    if (authorMatch) author = authorMatch[1].trim();
    const spineMatches = opfXml.match(/<itemref[^>]+idref=/gi);
    if (spineMatches) chaptersCount = Math.max(1, spineMatches.length);
  }

  return {
    id: `local-file-${encodeURIComponent(filename)}`,
    title,
    author,
    category: 'book',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    description: `Custom book with ${chaptersCount} chapters. Backed up to Google Drive cloud storage.`,
    genre: ['Custom Book', 'Google Drive Cloud', 'EPUB'],
    rating: 5.0,
    pointsPerChapter: 2.0,
    chapters: []
  };
}

/**
 * Parse all readable chapters from an in-memory EPUB buffer
 */
export async function parseEpubBufferToChapters(fileBuffer: Buffer | ArrayBuffer): Promise<Chapter[]> {
  const zip = await JSZip.loadAsync(fileBuffer);

  const containerFile = zip.file('META-INF/container.xml');
  let opfPath = 'OEBPS/content.opf';
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const match = containerXml.match(/full-path=["']([^"']+)["']/i);
    if (match) opfPath = match[1];
  }

  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error('Invalid EPUB: content.opf not found');
  }

  const opfXml = await opfFile.async('text');
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  const manifestItems: Record<string, string> = {};
  const manifestRegex = /<item\b([^>]+)>/gi;
  let match;
  while ((match = manifestRegex.exec(opfXml)) !== null) {
    const attrs = match[1];
    const id = (attrs.match(/\bid=["']([^"']+)["']/i) || [])[1];
    const href = (attrs.match(/\bhref=["']([^"']+)["']/i) || [])[1];
    if (id && href) manifestItems[id] = href;
  }

  const spineIds: string[] = [];
  const spineRegex = /<itemref[^>]+idref=["']([^"']+)["']/gi;
  while ((match = spineRegex.exec(opfXml)) !== null) {
    spineIds.push(match[1]);
  }

  const chapters: Chapter[] = [];
  let chapterIdx = 1;

  for (const id of spineIds) {
    const relativeHref = manifestItems[id];
    if (!relativeHref) continue;

    const fullHref = (opfDir + relativeHref).replace(/\\/g, '/');
    const chapterFile = zip.file(fullHref) || zip.file(relativeHref) || zip.file(decodeURIComponent(fullHref));
    if (!chapterFile) continue;

    const html = await chapterFile.async('text');
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();

    let headingTitle = '';
    const specificHeader = $('.chapter-title, [class*="chapter-title"]').first();
    if (specificHeader.length) {
      headingTitle = specificHeader.text().replace(/\s+/g, ' ').trim();
    }
    if (!headingTitle) {
      $('h1, h2, h3, title').each((_, el) => {
        if (headingTitle) return;
        const txt = $(el).text().replace(/\s+/g, ' ').trim();
        if (txt.length > 2 && txt.length < 100 && !/table of contents|contents|copyright/i.test(txt)) {
          headingTitle = txt;
        }
      });
    }

    const contentBlocks: string[] = [];
    $('body').find('h1, h2, h3, h4, h5, h6, p, hr, blockquote').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'hr') {
        if (contentBlocks.length > 0 && contentBlocks[contentBlocks.length - 1] !== '---') contentBlocks.push('---');
        return;
      }
      if (tag.startsWith('h')) {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text && text.length > 0 && text !== headingTitle && !/table of contents|contents|copyright/i.test(text)) {
          contentBlocks.push(`### ${text}`);
        }
        return;
      }
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text && text.length > 0) {
        contentBlocks.push(text);
      }
    });

    if (contentBlocks.length > 0) {
      chapters.push({
        id: `ch-${chapterIdx}`,
        chapterNumber: chapterIdx,
        title: headingTitle || `Chapter ${chapterIdx}`,
        content: contentBlocks,
        wordCount: contentBlocks.reduce((acc, block) => acc + block.split(/\s+/).length, 0)
      });
      chapterIdx++;
    }
  }

  return chapters;
}

