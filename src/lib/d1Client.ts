// Cloudflare D1 Client with hybrid Edge Binding & HTTP API support
// Works seamlessly in Cloudflare Pages edge runtime, Node.js dev server, and CI/CD

interface D1QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta?: any;
}

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'a6e4d829cbf36b3c65a818af2520c8b6';
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '96734247-386c-4736-9063-d4a6c26e87ff';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

export async function queryD1<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  // 1. Check if running inside Cloudflare Pages with native DB binding
  if (typeof (globalThis as any).process?.env?.DB?.prepare === 'function') {
    try {
      const binding = (globalThis as any).process.env.DB;
      const stmt = binding.prepare(sql).bind(...params);
      const res = await stmt.all();
      return (res.results || []) as T[];
    } catch (err) {
      console.warn('Native D1 binding failed, falling back to D1 HTTP API:', err);
    }
  }

  // 2. Direct HTTP API to Cloudflare D1
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql,
      params
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('D1 HTTP Query failed:', errorText);
    throw new Error(`D1 HTTP Query failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`D1 SQL Error: ${JSON.stringify(data.errors)}`);
  }

  const firstResult: D1QueryResult<T> = data.result?.[0];
  return (firstResult?.results || []) as T[];
}

export async function executeD1(sql: string, params: any[] = []): Promise<{ success: boolean; changes?: number; lastRowId?: number }> {
  // 1. Check if running inside Cloudflare Pages with native DB binding
  if (typeof (globalThis as any).process?.env?.DB?.prepare === 'function') {
    try {
      const binding = (globalThis as any).process.env.DB;
      const stmt = binding.prepare(sql).bind(...params);
      const res = await stmt.run();
      return {
        success: res.success,
        changes: res.meta?.changes,
        lastRowId: res.meta?.last_row_id
      };
    } catch (err) {
      console.warn('Native D1 binding execute failed, falling back to D1 HTTP API:', err);
    }
  }

  // 2. Direct HTTP API to Cloudflare D1
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql,
      params
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('D1 HTTP Execute failed:', errorText);
    throw new Error(`D1 HTTP Execute failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(`D1 SQL Error: ${JSON.stringify(data.errors)}`);
  }

  const firstResult = data.result?.[0];
  return {
    success: firstResult?.success ?? false,
    changes: firstResult?.meta?.changes,
    lastRowId: firstResult?.meta?.last_row_id
  };
}

export async function getStorageObject<T = any>(key: string): Promise<T | null> {
  try {
    const rows = await queryD1<{ data: string }>(
      'SELECT data FROM storage_objects WHERE key = ? LIMIT 1',
      [key]
    );
    if (rows && rows.length > 0 && rows[0].data) {
      return JSON.parse(rows[0].data);
    }
  } catch (err) {
    console.warn(`[D1] getStorageObject failed for key "${key}":`, err);
  }
  return null;
}

export async function setStorageObject(key: string, data: any): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(data);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');
    await executeD1(
      `INSERT INTO storage_objects (key, content_type, data, size_bytes)
       VALUES (?, 'application/json', ?, ?)
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, size_bytes = excluded.size_bytes`,
      [key, jsonStr, sizeBytes]
    );
    return true;
  } catch (err) {
    console.error(`[D1] setStorageObject failed for key "${key}":`, err);
    return false;
  }
}

