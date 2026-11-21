import fs from 'fs';
import path from 'path';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'a6e4d829cbf36b3c65a818af2520c8b6';
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '96734247-386c-4736-9063-d4a6c26e87ff';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function executeD1(sql, params = []) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 Error: ${JSON.stringify(data.errors)}`);
  }
  return data.result?.[0];
}

async function main() {
  console.log('🔄 Migrating users to Cloudflare D1...');
  const usersPath = path.join(process.cwd(), 'local-data', 'users.json');
  if (!fs.existsSync(usersPath)) {
    console.log('No local users.json found.');
    return;
  }

  const raw = fs.readFileSync(usersPath, 'utf-8');
  const users = JSON.parse(raw);
  console.log(`Found ${users.length} users to migrate.`);

  for (const u of users) {
    const preferences = {
      overviewBg: u.overviewBg || '',
      overviewBgSource: u.overviewBgSource || '',
      overviewAccent: u.overviewAccent || '',
      mangaTheme: u.mangaTheme || '',
      manhwaTheme: u.manhwaTheme || '',
      novelTheme: u.novelTheme || ''
    };

    const stats = {
      points: u.points || 0,
      totalChaptersRead: u.totalChaptersRead || 0,
      totalWordsRead: u.totalWordsRead || 0,
      readingMinutes: u.readingMinutes || 0,
      currentStreakDays: u.currentStreakDays || 1,
      badgeProgress: u.badgeProgress || {},
      unlockedBadges: u.unlockedBadges || []
    };

    const sql = `
      INSERT INTO users (
        id, email, name, password_hash, avatar, banner, bio,
        preferences, stats, readlist, recently_read, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        password_hash=excluded.password_hash,
        avatar=excluded.avatar,
        banner=excluded.banner,
        preferences=excluded.preferences,
        stats=excluded.stats,
        readlist=excluded.readlist,
        recently_read=excluded.recently_read,
        updated_at=excluded.updated_at
    `;

    const params = [
      u.id,
      u.email.toLowerCase().trim(),
      u.name || 'Reader',
      u.passwordHash || '',
      u.image || '',
      u.bannerImage || '',
      u.bio || '',
      JSON.stringify(preferences),
      JSON.stringify(stats),
      JSON.stringify(u.readlist || []),
      JSON.stringify(u.recentlyRead || []),
      u.createdAt ? Math.floor(new Date(u.createdAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    ];

    await executeD1(sql, params);
    console.log(`✅ Migrated user: ${u.email} (${u.name})`);
  }

  console.log('🎉 User migration to Cloudflare D1 complete!');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
