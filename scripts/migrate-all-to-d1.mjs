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

async function setStorageObject(key, data) {
  const jsonStr = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');
  await executeD1(
    `INSERT INTO storage_objects (key, content_type, data, size_bytes)
     VALUES (?, 'application/json', ?, ?)
     ON CONFLICT(key) DO UPDATE SET data = excluded.data, size_bytes = excluded.size_bytes`,
    [key, jsonStr, sizeBytes]
  );
  console.log(`✅ Uploaded ${key} (${(sizeBytes / 1024).toFixed(1)} KB) to D1 storage_objects`);
}

async function main() {
  console.log('🚀 Migrating all local-data to Cloudflare D1...');

  const mappings = [
    { file: 'posts.json', key: 'community_posts' },
    { file: 'comments.json', key: 'community_comments' },
    { file: 'activities.json', key: 'community_activities' },
    { file: 'messages.json', key: 'community_messages' },
    { file: 'teams.json', key: 'community_teams' },
    { file: 'user_follows.json', key: 'community_user_follows' },
    { file: 'user_presence.json', key: 'community_user_presence' },
    { file: 'scene_pins.json', key: 'scene_pins' },
    { file: 'reading_sessions.json', key: 'reading_sessions' },
    { file: 'chapter_claims.json', key: 'chapter_claims' }
  ];

  const baseDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'local-data');
  for (const m of mappings) {
    const filePath = path.join(baseDir, m.file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content || 'null');
        if (parsed !== null) {
          await setStorageObject(m.key, parsed);
        }
      } catch (err) {
        console.error(`Error migrating ${m.file}:`, err);
      }
    }
  }

  console.log('🎉 Migration of local-data to D1 complete!');
}

main().catch(console.error);
