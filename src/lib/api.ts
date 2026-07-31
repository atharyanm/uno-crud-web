// src/lib/api.ts - Next.js API client helper with memory cache
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 15000; // 15 seconds

export function clearApiCache(table?: string) {
  if (table) {
    cache.delete(table);
  } else {
    cache.clear();
  }
}

export async function fetchData(table: string, forceRefresh = false): Promise<any[]> {
  try {
    const now = Date.now();
    if (!forceRefresh && cache.has(table)) {
      const entry = cache.get(table)!;
      if (now - entry.timestamp < CACHE_TTL) {
        return entry.data;
      }
    }

    const response = await fetch(`/api/rest/${table}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cache.set(table, { timestamp: now, data });
    return data;
  } catch (error) {
    console.error(`Error fetching table ${table}:`, error);
    return [];
  }
}

export async function insertData(table: string, data: any): Promise<any> {
  try {
    const response = await fetch(`/api/rest/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Insert error: ${response.statusText}`);
    clearApiCache(table);
    return await response.json();
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return null;
  }
}

export async function updateData(table: string, id: string | number, data: any): Promise<any> {
  try {
    let idField = 'id_user';
    if (table === 'Player') idField = 'id_player';
    if (table === 'Place') idField = 'id_place';
    if (table === 'Game') idField = 'id_game';
    if (table === 'Data') idField = 'id';

    const response = await fetch(`/api/rest/${table}?${idField}=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Update error: ${response.statusText}`);
    clearApiCache(table);
    return await response.json();
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return null;
  }
}

export async function deleteData(table: string, id: string | number): Promise<boolean> {
  try {
    let idField = 'id_user';
    if (table === 'Player') idField = 'id_player';
    if (table === 'Place') idField = 'id_place';
    if (table === 'Game') idField = 'id_game';
    if (table === 'Data') idField = 'id';

    const response = await fetch(`/api/rest/${table}?${idField}=eq.${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`Delete error: ${response.statusText}`);
    clearApiCache(table);
    return true;
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return false;
  }
}

export async function generateSequentialId(table: string, prefix: string): Promise<string> {
  try {
    const data = await fetchData(table);
    const ids = data
      .map((item) => {
        const idField = Object.keys(item).find((key) => key.includes('id_'));
        return idField ? item[idField] : null;
      })
      .filter((id) => id && typeof id === 'string' && id.startsWith(prefix));

    if (ids.length === 0) {
      return `${prefix}001`;
    }

    const numbers = ids.map((id) => parseInt(id.replace(prefix, ''), 10)).filter((n) => !isNaN(n));
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error(`Error generating ID for ${table}:`, error);
    return `${prefix}001`;
  }
}
