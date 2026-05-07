const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');

const app = express();

// ─── MIDDLEWARE GLOBAL ────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve folder uploads sebagai static file
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth',       require('./src/routes/auth'));
app.use('/api/laporan',    require('./src/routes/laporan'));
app.use('/api/comments',   require('./src/routes/comment'));
app.use('/api/users',      require('./src/routes/user'));
app.use('/api/categories', require('./src/routes/category'));

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🟢 Backend Pengaduan Masyarakat berjalan.' });
});

// ─── 404 HANDLER ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// ─── START SERVER ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});