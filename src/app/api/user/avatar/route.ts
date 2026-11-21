import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById, findUserByAny, updateUser, createUser } from '@/lib/userDb';
import { saveStorageMedia, deleteStorageMedia } from '@/lib/d1Client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const AVATAR_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

function ensureUploadDir() {
  try {
    if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
      fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem in serverless environments (Vercel)
  }
}

// Safely delete a previous uploaded avatar from D1 and disk
async function deleteOldAvatar(userId?: string | null, avatarUrl?: string | null) {
  if (userId) {
    try {
      await deleteStorageMedia(`avatar_${userId}`);
    } catch {}
  }

  if (!avatarUrl) return;
  if (!avatarUrl.startsWith('/uploads/avatars/')) return;

  try {
    const fileName = path.basename(avatarUrl);
    const fullPath = path.join(AVATAR_UPLOAD_DIR, fileName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Avatar API] Successfully deleted old avatar file: ${fileName}`);
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
      return NextResponse.json({ success: true, avatarUrl: null });
    }

    const user = findUserByEmail(userQuery) || findUserById(userQuery) || findUserByAny(userQuery);
    let avatarUrl = user?.image || null;

    if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
      const localPath = path.join(process.cwd(), 'public', avatarUrl);
      try {
        if (!fs.existsSync(localPath)) {
          avatarUrl = `/api/user/image?id=avatar_${user?.id}`;
        }
      } catch {
        avatarUrl = `/api/user/image?id=avatar_${user?.id}`;
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl
    });
  } catch (error) {
    console.error('Error in GET /api/user/avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve avatar' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const contentType = request.headers.get('content-type') || '';

    // CASE 1: Preset Avatar selection (JSON)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const userEmail = body.userEmail || session?.user?.email;
      const avatarUrl = body.avatarUrl;

      if (!userEmail) {
        return NextResponse.json(
          { success: false, error: 'Authentication or user email required.' },
          { status: 401 }
        );
      }

      if (!avatarUrl || typeof avatarUrl !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Valid avatar URL required.' },
          { status: 400 }
        );
      }

      let user = findUserByEmail(userEmail) || findUserById(userEmail);
      if (!user) {
        user = createUser({
          name: session?.user?.name || userEmail.split('@')[0],
          email: userEmail,
          image: avatarUrl,
          provider: 'google'
        });
      } else {
        // If user previously had a custom uploaded file, clean it up!
        if (user.image && user.image !== avatarUrl) {
          await deleteOldAvatar(user.id, user.image);
        }
        updateUser(user.id, { image: avatarUrl });
      }

      return NextResponse.json({
        success: true,
        avatarUrl,
        message: 'Preset avatar updated and previous uploaded file cleaned up.'
      });
    }

    // CASE 2: Custom Avatar File Upload (FormData)
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
        { success: false, error: 'No avatar image file provided.' },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed 10MB limit.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const originalExt = path.extname(file.name || '').toLowerCase() || '.png';
    const cleanExt = originalExt.replace(/[^a-z0-9.]/g, '');

    if (!allowedTypes.includes(file.type) && !['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(cleanExt)) {
      return NextResponse.json(
        { success: false, error: 'Only image files (JPEG, PNG, WEBP, GIF) are accepted.' },
        { status: 400 }
      );
    }

    let user = findUserByEmail(userEmail) || findUserById(userEmail);
    if (!user) {
      user = createUser({
        name: session?.user?.name || userEmail.split('@')[0],
        email: userEmail,
        image: '',
        provider: 'google'
      });
    }

    // 1. Delete previous uploaded avatar file from D1 and disk
    await deleteOldAvatar(user.id, user.image);

    // 2. Read file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const d1Key = `avatar_${user.id}`;

    // 3. Persist to Cloudflare D1
    await saveStorageMedia(d1Key, mimeType, buffer);

    // 4. Optionally write to local disk (in dev) without throwing on Vercel EROFS
    try {
      ensureUploadDir();
      const safeExt = cleanExt.startsWith('.') ? cleanExt : `.${cleanExt}`;
      const fileName = `avatar_${user.id}_${Date.now()}${safeExt}`;
      const targetFilePath = path.join(AVATAR_UPLOAD_DIR, fileName);
      fs.writeFileSync(targetFilePath, buffer);
    } catch {
      // Safely ignore on read-only serverless
    }

    // 5. Update user record with permanent media route URL
    const publicAvatarUrl = `/api/user/image?id=${d1Key}&v=${Date.now()}`;
    updateUser(user.id, { image: publicAvatarUrl });

    return NextResponse.json({
      success: true,
      avatarUrl: publicAvatarUrl,
      message: 'Profile photo uploaded and saved successfully.'
    });
  } catch (error) {
    console.error('Error in POST /api/user/avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while uploading avatar.' },
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

    // Clean up uploaded file in D1 and disk
    await deleteOldAvatar(user.id, user.image);

    // Reset image in users.json
    updateUser(user.id, { image: '' });

    return NextResponse.json({
      success: true,
      avatarUrl: null,
      message: 'Avatar reset to default.'
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while resetting avatar.' },
      { status: 500 }
    );
  }
}
