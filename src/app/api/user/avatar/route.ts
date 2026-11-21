import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById, findUserByAny, updateUser, createUser } from '@/lib/userDb';
import fs from 'fs';
import path from 'path';

const AVATAR_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

function ensureUploadDir() {
  if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
    fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
  }
}

// Safely delete a previous uploaded avatar from disk
function deleteOldAvatar(avatarUrl?: string | null) {
  if (!avatarUrl) return;
  if (!avatarUrl.startsWith('/uploads/avatars/')) return;

  const fileName = path.basename(avatarUrl);
  const fullPath = path.join(AVATAR_UPLOAD_DIR, fileName);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Avatar API] Successfully deleted old avatar file: ${fileName}`);
    }
  } catch (err) {
    console.warn(`[Avatar API] Failed to delete previous avatar file ${fileName}:`, err);
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
    return NextResponse.json({
      success: true,
      avatarUrl: user?.image || null
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
        // If user previously had a custom uploaded file on disk, clean it up!
        if (user.image && user.image !== avatarUrl) {
          deleteOldAvatar(user.image);
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

    // Delete previous uploaded avatar file if one existed
    if (user.image) {
      deleteOldAvatar(user.image);
    }

    ensureUploadDir();

    const safeExt = cleanExt.startsWith('.') ? cleanExt : `.${cleanExt}`;
    const fileName = `avatar_${user.id}_${Date.now()}${safeExt}`;
    const targetFilePath = path.join(AVATAR_UPLOAD_DIR, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(targetFilePath, buffer);

    const publicAvatarUrl = `/uploads/avatars/${fileName}`;

    // Update user record in users.json
    updateUser(user.id, { image: publicAvatarUrl });

    return NextResponse.json({
      success: true,
      avatarUrl: publicAvatarUrl,
      message: 'Profile photo uploaded and previous photo cleaned up.'
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

    // Clean up uploaded file on disk if it was an uploaded file
    if (user.image) {
      deleteOldAvatar(user.image);
    }

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
