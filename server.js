const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// Serve static web application files
app.use(express.static(path.join(__dirname)));

// API REST routes matching PostgREST syntax for Neon PostgreSQL backend

// GET /rest/v1/:table
app.get('/rest/v1/:table', async (req, res) => {
    try {
        const table = req.params.table;
        const limit = parseInt(req.query.limit) || 1000;
        const offset = parseInt(req.query.offset) || 0;

        let orderCol = 'id';
        if (table === 'User') orderCol = 'id_user';
        if (table === 'Player') orderCol = 'id_player';
        if (table === 'Place') orderCol = 'id_place';
        if (table === 'Game') orderCol = 'id_game';

        const query = `SELECT * FROM "${table}" ORDER BY "${orderCol}" ASC LIMIT $1 OFFSET $2`;
        const result = await pool.query(query, [limit, offset]);
        res.json(result.rows);
    } catch (err) {
        console.error(`Error GET /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// POST /rest/v1/:table
app.post('/rest/v1/:table', async (req, res) => {
    try {
        const table = req.params.table;
        const data = req.body;

        const keys = Object.keys(data);
        const values = Object.values(data);

        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);

        res.status(201).json(result.rows);
    } catch (err) {
        console.error(`Error POST /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /rest/v1/:table
app.patch('/rest/v1/:table', async (req, res) => {
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
        res.json(result.rows);
    } catch (err) {
        console.error(`Error PATCH /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /rest/v1/:table
app.delete('/rest/v1/:table', async (req, res) => {
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
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(`Error DELETE /rest/v1/${req.params.table}:`, err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} with Neon PostgreSQL backend`);
});
