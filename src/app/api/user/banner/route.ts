import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findUserByEmail, findUserById, findUserByAny, updateUser, createUser } from '@/lib/userDb';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'banners');

// Helper to ensure banner directory exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Safely delete a previous uploaded banner from disk
function deleteOldBanner(bannerUrl?: string | null) {
  if (!bannerUrl) return;
  if (!bannerUrl.startsWith('/uploads/banners/')) return;

  const fileName = path.basename(bannerUrl);
  const fullPath = path.join(UPLOAD_DIR, fileName);

  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Banner API] Successfully deleted old banner file: ${fileName}`);
    }
  } catch (err) {
    console.warn(`[Banner API] Failed to delete previous banner file ${fileName}:`, err);
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
    return NextResponse.json({
      success: true,
      bannerUrl: user?.bannerImage || '/spotlight-backdrop.png'
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

    // Delete the previous banner file from disk if one exists
    if (user.bannerImage) {
      deleteOldBanner(user.bannerImage);
    }

    ensureUploadDir();

    // Generate safe unique filename
    const safeExt = cleanExt.startsWith('.') ? cleanExt : `.${cleanExt}`;
    const fileName = `banner_${user.id}_${Date.now()}${safeExt}`;
    const targetFilePath = path.join(UPLOAD_DIR, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(targetFilePath, buffer);

    const publicBannerUrl = `/uploads/banners/${fileName}`;

    // Update user record in users.json
    updateUser(user.id, { bannerImage: publicBannerUrl });

    return NextResponse.json({
      success: true,
      bannerUrl: publicBannerUrl,
      message: 'Profile background updated and previous background cleaned up.'
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

    // Remove existing file from disk if it was an uploaded file
    if (user.bannerImage) {
      deleteOldBanner(user.bannerImage);
    }

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
