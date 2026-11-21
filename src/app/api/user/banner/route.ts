import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById, findUserByAny, updateUser, createUser } from '@/lib/userDb';
import { saveStorageMedia, deleteStorageMedia } from '@/lib/d1Client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'banners');

// Helper to safely ensure banner directory exists in writable environments
function ensureUploadDir() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem in serverless environments (Vercel)
  }
}

// Safely delete a previous uploaded banner from D1 and disk
async function deleteOldBanner(userId?: string | null, bannerUrl?: string | null) {
  if (userId) {
    try {
      await deleteStorageMedia(`banner_${userId}`);
    } catch {}
  }

  if (!bannerUrl) return;
  if (!bannerUrl.startsWith('/uploads/banners/')) return;

  try {
    const fileName = path.basename(bannerUrl);
    const fullPath = path.join(UPLOAD_DIR, fileName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Banner API] Successfully deleted old banner file: ${fileName}`);
    }
  } catch (err) {
    // Safely ignore on read-only serverless
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userQuery = searchParams.get('user') || session?.user?.email;

    if (!userQuery) {
      return NextResponse.json({ success: true, bannerUrl: '/spotlight-backdrop.png' });
    }

    const user = findUserByEmail(userQuery) || findUserById(userQuery) || findUserByAny(userQuery);
    let bannerUrl = user?.bannerImage || '/spotlight-backdrop.png';

    // If bannerUrl points to a legacy local file path that doesn't exist on Vercel:
    if (bannerUrl.startsWith('/uploads/banners/')) {
      const localPath = path.join(process.cwd(), 'public', bannerUrl);
      try {
        if (!fs.existsSync(localPath)) {
          bannerUrl = `/api/user/image?id=banner_${user?.id}`;
        }
      } catch {
        bannerUrl = `/api/user/image?id=banner_${user?.id}`;
      }
    }

    return NextResponse.json({
      success: true,
      bannerUrl
    });
  } catch (error) {
    console.error('Error in GET /api/user/banner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve banner' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const emailFromBody = formData.get('userEmail') as string | null;
    const userEmail = emailFromBody || session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication or user email required.' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided.' },
        { status: 400 }
      );
    }

    // Size validation (15 MB max)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed 15MB limit.' },
        { status: 400 }
      );
    }

    // MIME type check
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const originalExt = path.extname(file.name || '').toLowerCase() || '.png';
    const cleanExt = originalExt.replace(/[^a-z0-9.]/g, '');

    if (!allowedTypes.includes(file.type) && !['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(cleanExt)) {
      return NextResponse.json(
        { success: false, error: 'Only image files (JPEG, PNG, WEBP, GIF) are accepted.' },
        { status: 400 }
      );
    }

    // Find or provision user
    let user = findUserByEmail(userEmail) || findUserById(userEmail);
    if (!user) {
      user = createUser({
        name: session?.user?.name || userEmail.split('@')[0],
        email: userEmail,
        image: session?.user?.image || '',
        provider: 'google'
      });
    }

    // 1. Clean up old banner from D1 and disk
    await deleteOldBanner(user.id, user.bannerImage);

    // 2. Read image buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const d1Key = `banner_${user.id}`;

    // 3. Persist to Cloudflare D1 (Universal serverless persistent storage)
    await saveStorageMedia(d1Key, mimeType, buffer);

    // 4. In local dev, optionally save to disk if directory is writable (never throw on EROFS)
    try {
      ensureUploadDir();
      const safeExt = cleanExt.startsWith('.') ? cleanExt : `.${cleanExt}`;
      const fileName = `banner_${user.id}_${Date.now()}${safeExt}`;
      const targetFilePath = path.join(UPLOAD_DIR, fileName);
      fs.writeFileSync(targetFilePath, buffer);
    } catch {
      // Expected on Vercel read-only filesystem, safely ignored
    }

    // 5. Update user record with permanent media route URL
    const publicBannerUrl = `/api/user/image?id=${d1Key}&v=${Date.now()}`;
    updateUser(user.id, { bannerImage: publicBannerUrl });

    return NextResponse.json({
      success: true,
      bannerUrl: publicBannerUrl,
      message: 'Profile background updated and saved successfully.'
    });
  } catch (error) {
    console.error('Error in POST /api/user/banner:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while uploading banner.' },
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

    const user = findUserByEmail(userQuery) || findUserById(userQuery) || findUserByAny(userQuery);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    // Remove existing banner from D1 and disk
    await deleteOldBanner(user.id, user.bannerImage);

    // Reset user's bannerImage field
    updateUser(user.id, { bannerImage: undefined });

    return NextResponse.json({
      success: true,
      bannerUrl: '/spotlight-backdrop.png',
      message: 'Profile background reset to default.'
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/banner:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while deleting banner.' },
      { status: 500 }
    );
  }
}
