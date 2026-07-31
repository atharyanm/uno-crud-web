const path = require('path');
const express = require('express');
const app = require('./api/index');

const PORT = process.env.PORT || 8000;

// Serve static web application files
app.use(express.static(path.join(__dirname)));

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT} with Neon PostgreSQL backend`);
    });
}

module.exports = app;
