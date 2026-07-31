// koneksi.js - High-performance API connection to Neon PostgreSQL backend
const SUPABASE_URL = (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null' && window.location.origin !== 'file://' && (window.location.port === '8000' || (!['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.hostname !== ''))) ? window.location.origin : 'http://localhost:8000';
const SUPABASE_ANON_KEY = 'neon';

// Client-side cache
if (typeof window.dataCache === 'undefined') {
    window.dataCache = new Map();
}
var dataCache = window.dataCache;
const CACHE_TTL_MS = 15000; // 15 seconds


function clearClientCache(table) {
    if (table) {
        dataCache.delete(table);
    } else {
        dataCache.clear();
    }
}

async function fetchData(table, forceRefresh = false) {
    try {
        const now = Date.now();
        if (!forceRefresh && dataCache.has(table)) {
            const entry = dataCache.get(table);
            if (now - entry.timestamp < CACHE_TTL_MS) {
                console.log(`⚡ Using client cached data for table: ${table} (${entry.data.length} records)`);
                return entry.data;
            }
        }

        console.log(`🚀 Fetching fresh data from table: ${table}`);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);

        const data = await response.json();
        dataCache.set(table, { timestamp: now, data: data });
        console.log(`✅ Successfully fetched ${data.length} total records from table '${table}'`);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

async function insertData(table, data) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        clearClientCache(table);
        return await response.json();
    } catch (error) {
        console.error('Error inserting data:', error);
        return null;
    }
}

async function updateData(table, id, data) {
    try {
        let idField = 'id_user';
        if (table === 'Player') idField = 'id_player';
        if (table === 'Place') idField = 'id_place';
        if (table === 'Game') idField = 'id_game';
        if (table === 'Data') idField = 'id';

        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idField}=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        clearClientCache(table);
        return await response.json();
    } catch (error) {
        console.error('Error updating data:', error);
        return null;
    }
}

async function deleteData(table, id) {
    try {
        let idField = 'id_user';
        if (table === 'Player') idField = 'id_player';
        if (table === 'Place') idField = 'id_place';
        if (table === 'Game') idField = 'id_game';
        if (table === 'Data') idField = 'id';

        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idField}=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Network response was not ok');
        clearClientCache(table);
        return true;
    } catch (error) {
        console.error('Error deleting data:', error);
        return null;
    }
}

async function generateSequentialId(sheet, prefix) {
    try {
        const data = await fetchData(sheet);
        const ids = data.map(item => {
            const idField = Object.keys(item).find(key => key.includes('id_'));
            return item[idField];
        }).filter(id => id && id.startsWith(prefix));

        if (ids.length === 0) {
            return `${prefix}001`;
        }

        const numbers = ids.map(id => parseInt(id.replace(prefix, '')));
        const maxNumber = Math.max(...numbers);
        const nextNumber = maxNumber + 1;
        return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating sequential ID:', error);
        return `${prefix}001`;
    }
}
