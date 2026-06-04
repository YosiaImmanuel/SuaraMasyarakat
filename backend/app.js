const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');

const app = express();

// ─── MIDDLEWARE GLOBAL ────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Note: Uploads are now handled via Cloudinary

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

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Uncaught error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
  });
  res.status(500).json({
    message: 'Server error.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ─── START SERVER ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});