const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fCiRrntQXE05@ep-crimson-resonance-az0bsitd-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

app.use(cors());
app.use(express.json());

// In-memory cache for API endpoints
const cache = new Map();
const CACHE_TTL = 15000; // 15 seconds

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    cache.set(key, { timestamp: Date.now(), data });
}

function clearCache(table) {
    cache.delete(table);
    for (const key of cache.keys()) {
        if (key.startsWith(table)) cache.delete(key);
    }
}

const router = express.Router();

// GET /rest/v1/:table
router.get('/:table', async (req, res) => {
    try {
        const table = req.params.table;
        const limitParam = req.query.limit;
        const offsetParam = req.query.offset;
        
        const cacheKey = `${table}_${limitParam || 'all'}_${offsetParam || 0}`;
        const cachedData = getCached(cacheKey);
        if (cachedData) {
            res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
            return res.json(cachedData);
        }

        let orderCol = 'id';
        if (table === 'User') orderCol = 'id_user';
        if (table === 'Player') orderCol = 'id_player';
        if (table === 'Place') orderCol = 'id_place';
        if (table === 'Game') orderCol = 'id_game';

        let query;
        let params = [];

        if (limitParam) {
            const limit = parseInt(limitParam);
            const offset = parseInt(offsetParam) || 0;
            query = `SELECT * FROM "${table}" ORDER BY "${orderCol}" ASC LIMIT $1 OFFSET $2`;
            params = [limit, offset];
        } else {
            query = `SELECT * FROM "${table}" ORDER BY "${orderCol}" ASC`;
        }

        const result = await pool.query(query, params);
        setCache(cacheKey, result.rows);
        
        res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
        res.json(result.rows);
    } catch (err) {
        console.error(`Error GET /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// POST /rest/v1/:table
router.post('/:table', async (req, res) => {
    try {
        const table = req.params.table;
        const data = req.body;

        const keys = Object.keys(data);
        const values = Object.values(data);

        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);

        clearCache(table);
        res.status(201).json(result.rows);
    } catch (err) {
        console.error(`Error POST /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /rest/v1/:table
router.patch('/:table', async (req, res) => {
    try {
        const table = req.params.table;
        const data = req.body;

        let idField = null;
        let idVal = null;

        for (const [key, val] of Object.entries(req.query)) {
            if (typeof val === 'string' && val.startsWith('eq.')) {
                idField = key;
                idVal = val.replace('eq.', '');
                break;
            }
        }

        if (!idField || !idVal) {
            return res.status(400).json({ error: 'Missing filter parameter (e.g., ?id_user=eq.XYZ)' });
        }

        const keys = Object.keys(data);
        const values = Object.values(data);

        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        values.push(idVal);
        const query = `UPDATE "${table}" SET ${setClause} WHERE "${idField}" = $${values.length} RETURNING *`;

        const result = await pool.query(query, values);
        clearCache(table);
        res.json(result.rows);
    } catch (err) {
        console.error(`Error PATCH /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /rest/v1/:table
router.delete('/:table', async (req, res) => {
    try {
        const table = req.params.table;

        let idField = null;
        let idVal = null;

        for (const [key, val] of Object.entries(req.query)) {
            if (typeof val === 'string' && val.startsWith('eq.')) {
                idField = key;
                idVal = val.replace('eq.', '');
                break;
            }
        }

        if (!idField || !idVal) {
            return res.status(400).json({ error: 'Missing filter parameter (e.g., ?id_user=eq.XYZ)' });
        }

        const query = `DELETE FROM "${table}" WHERE "${idField}" = $1`;
        await pool.query(query, [idVal]);
        clearCache(table);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(`Error DELETE /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

app.use(['/rest/v1', '/api/rest/v1'], router);

module.exports = app;
