// koneksi.js - API connection to Supabase
const SUPABASE_URL = 'https://vbgiivtovglbddxkfmhv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZ2lpdnRvdmdsYmRkeGtmbWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjM3ODgsImV4cCI6MjA3NzcyMzc4OH0.pCLOjFEywBj8BU0-9F1JcQ4ro3jccz38oRYy1GTAMOU';

async function fetchData(table) {
    try {
        console.log(`Fetching data from table: ${table}`);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Response status: ${response.status}`);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log(`Fetched ${data.length} records from ${table}`);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

async function insertData(table, data) {
    try {
        if (table === 'Data') {
            // Generate sequential id for Data table
            const existingData = await fetchData('Data');
            const maxId = existingData.length > 0 ? Math.max(...existingData.map(d => d.id)) : 0;
            data.id = maxId + 1;
        }
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
        return true; // DELETE doesn't return data, just success
    } catch (error) {
        console.error('Error deleting data:', error);
        return null;
    }
}

// Helper function to generate sequential IDs
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
