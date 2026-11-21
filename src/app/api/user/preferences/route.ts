import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  findUserByEmail,
  findUserById,
  createUser,
  getUserPreferences,
  updateUserPreferences
} from '@/lib/userDb';
import fs from 'fs';
import path from 'path';

const OVERVIEW_BG_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'overview-bg');

function ensureUploadDir() {
  if (!fs.existsSync(OVERVIEW_BG_UPLOAD_DIR)) {
    fs.mkdirSync(OVERVIEW_BG_UPLOAD_DIR, { recursive: true });
  }
}

// Safely delete a previous uploaded overview background from disk
function deleteOldOverviewBg(bgUrl?: string | null) {
  if (!bgUrl) return;
  if (!bgUrl.startsWith('/uploads/overview-bg/')) return;

  const fileName = path.basename(bgUrl);
  const fullPath = path.join(OVERVIEW_BG_UPLOAD_DIR, fileName);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Preferences API] Successfully deleted old overview bg file: ${fileName}`);
    }
  } catch (err) {
    console.warn(`[Preferences API] Failed to delete old overview bg file ${fileName}:`, err);
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userQuery = searchParams.get('user') || session?.user?.email;

    if (!userQuery) {
      return NextResponse.json({
        success: true,
        overviewBg: null,
        overviewBgSource: null,
        overviewAccent: null,
        mangaTheme: null,
        manhwaTheme: null,
        novelTheme: null
      });
    }

    const prefs = getUserPreferences(userQuery);
    return NextResponse.json({
      success: true,
      overviewBg: prefs?.overviewBg || null,
      overviewBgSource: prefs?.overviewBgSource || null,
      overviewAccent: prefs?.overviewAccent || null,
      mangaTheme: prefs?.mangaTheme || null,
      manhwaTheme: prefs?.manhwaTheme || null,
      novelTheme: prefs?.novelTheme || null
    });
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve user preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const contentType = request.headers.get('content-type') || '';

    let userEmail: string | null = null;
    let overviewBg: string | undefined = undefined;
    let overviewBgSource: string | undefined = undefined;
    let overviewAccent: string | undefined = undefined;
    let mangaTheme: string | undefined = undefined;
    let manhwaTheme: string | undefined = undefined;
    let novelTheme: string | undefined = undefined;

    // 1. Multipart Form Data (Custom file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      userEmail = (formData.get('userEmail') as string | null) || session?.user?.email || null;
      overviewAccent = (formData.get('overviewAccent') as string | null) || undefined;
      mangaTheme = (formData.get('mangaTheme') as string | null) || undefined;
      manhwaTheme = (formData.get('manhwaTheme') as string | null) || undefined;
      novelTheme = (formData.get('novelTheme') as string | null) || undefined;

      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: 'Authentication or user email required.' },
          { status: 401 }
        );
      }

      let user = findUserByEmail(userEmail) || findUserById(userEmail);
      if (!user) {
        user = createUser({
          name: session?.user?.name || userEmail.split('@')[0],
          email: userEmail,
          image: session?.user?.image || '',
          provider: 'google'
        });
      }

      if (file && file.size > 0) {
        // Validation: 15MB limit
        if (file.size > 15 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'File size exceeds 15MB limit.' },
            { status: 400 }
          );
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        const originalExt = path.extname(file.name || '').toLowerCase() || '.png';
        const cleanExt = originalExt.replace(/[^a-z0-9.]/g, '');

        if (!allowedTypes.includes(file.type) && !['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(cleanExt)) {
          return NextResponse.json(
            { success: false, error: 'Only image files are accepted.' },
            { status: 400 }
          );
        }

        // Delete old uploaded overview background if one exists
        if (user.overviewBg) {
          deleteOldOverviewBg(user.overviewBg);
        }

        ensureUploadDir();
        const safeExt = cleanExt.startsWith('.') ? cleanExt : `.${cleanExt}`;
        const fileName = `overview_bg_${user.id}_${Date.now()}${safeExt}`;
        const targetPath = path.join(OVERVIEW_BG_UPLOAD_DIR, fileName);

        const bytes = await file.arrayBuffer();
        fs.writeFileSync(targetPath, Buffer.from(bytes));

        overviewBg = `/uploads/overview-bg/${fileName}`;
        overviewBgSource = 'upload';
      }
    } else {
      // 2. JSON Body (URL wallpaper or theme accent update)
      const body = await request.json();
      userEmail = body.userEmail || session?.user?.email || null;
      overviewBg = body.overviewBg;
      overviewBgSource = body.overviewBgSource;
      overviewAccent = body.overviewAccent;
      mangaTheme = body.mangaTheme;
      manhwaTheme = body.manhwaTheme;
      novelTheme = body.novelTheme;
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication or user email required.' },
        { status: 401 }
      );
    }

    let user = findUserByEmail(userEmail) || findUserById(userEmail);
    if (!user) {
      user = createUser({
        name: session?.user?.name || userEmail.split('@')[0],
        email: userEmail,
        image: session?.user?.image || '',
        provider: 'google'
      });
    }

    // If setting an external URL or shuffling, clean up any previous local uploaded file
    if (overviewBg && overviewBg !== user.overviewBg && user.overviewBg?.startsWith('/uploads/overview-bg/')) {
      deleteOldOverviewBg(user.overviewBg);
    }

    const updatedUser = updateUserPreferences(user.id, {
      ...(overviewBg !== undefined ? { overviewBg, overviewBgSource: overviewBgSource || 'web' } : {}),
      ...(overviewAccent !== undefined ? { overviewAccent } : {}),
      ...(mangaTheme !== undefined ? { mangaTheme } : {}),
      ...(manhwaTheme !== undefined ? { manhwaTheme } : {}),
      ...(novelTheme !== undefined ? { novelTheme } : {})
    });

    return NextResponse.json({
      success: true,
      overviewBg: updatedUser?.overviewBg || overviewBg,
      overviewBgSource: updatedUser?.overviewBgSource || overviewBgSource,
      overviewAccent: updatedUser?.overviewAccent || overviewAccent,
      mangaTheme: updatedUser?.mangaTheme,
      manhwaTheme: updatedUser?.manhwaTheme,
      novelTheme: updatedUser?.novelTheme,
      message: 'Preferences saved successfully in user data.'
    });
  } catch (error) {
    console.error('Error in POST /api/user/preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userQuery = searchParams.get('user') || session?.user?.email;

    if (!userQuery) {
      return NextResponse.json(
        { success: false, error: 'Authentication or user email required.' },
        { status: 401 }
      );
    }

    const user = findUserByEmail(userQuery) || findUserById(userQuery);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.overviewBg) {
      deleteOldOverviewBg(user.overviewBg);
    }

    updateUserPreferences(user.id, {
      overviewBg: undefined,
      overviewBgSource: undefined,
      overviewAccent: undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Overview preferences reset to default'
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete preferences' },
      { status: 500 }
    );
  }
}
