import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { folderUrl, apiKey } = await request.json();

    if (!folderUrl) {
      return NextResponse.json({ error: 'Google Drive folder URL or ID is required' }, { status: 400 });
    }

    // Extract folder ID
    // Formats:
    // https://drive.google.com/drive/folders/1A2B3C4D5E...
    // or https://drive.google.com/drive/u/0/folders/1A2B3C4D5E...
    // or plain ID: 1A2B3C4D5E...
    const folderMatch = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/) || [null, folderUrl.trim()];
    const folderId = folderMatch[1];

    if (!folderId) {
      return NextResponse.json({ error: 'Could not extract valid Folder ID from link' }, { status: 400 });
    }

    // If an API key is provided, query Google Drive v3 API
    if (apiKey) {
      const gUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,size)`;
      const res = await fetch(gUrl);
      if (res.ok) {
        const data = await res.json();
        const epubFiles = (data.files || []).filter((f: { name?: string }) =>
          f.name?.toLowerCase().endsWith('.epub')
        );

        return NextResponse.json({
          success: true,
          folderId,
          totalFilesFound: epubFiles.length,
          files: epubFiles,
          message: `Discovered ${epubFiles.length} EPUB files in Google Drive folder.`
        });
      }
    }

    // If no API key, provide instructions for the 1-click Google Apps Script webhook
    return NextResponse.json({
      success: true,
      folderId,
      message: 'Folder connected. Use Google Apps Script or Google Drive for Desktop for continuous automatic synchronization without manual link copying.',
      syncMethods: [
        {
          name: 'Google Drive for Desktop (Zero-Click)',
          description: 'Any file dropped into your synced Google Drive folder on your phone or laptop instantly syncs to readverse/local-books/ on your Mac.'
        },
        {
          name: 'Google Apps Script Auto-Sync Webhook',
          description: 'A 5-line script on Google Drive automatically notifies ReadVerse whenever a new EPUB is added.'
        }
      ]
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
