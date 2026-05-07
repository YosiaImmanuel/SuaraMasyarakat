const db = require('../config/database');

// ─── GET COMMENTS BY LAPORAN ID ──────────────────────────
const getByLaporan = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.nama AS nama_user
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.laporan_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.laporanId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── CREATE COMMENT ───────────────────────────────────────
const create = async (req, res) => {
  const { laporan_id, isi } = req.body;

  if (!laporan_id || !isi) {
    return res.status(400).json({ message: 'laporan_id dan isi komentar wajib diisi.' });
  }

  try {
    const [laporan] = await db.query('SELECT id FROM laporan WHERE id = ?', [laporan_id]);
    if (laporan.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }

    const [result] = await db.query(
      'INSERT INTO comments (laporan_id, user_id, isi) VALUES (?, ?, ?)',
      [laporan_id, req.user.id, isi]
    );
    res.status(201).json({ message: 'Komentar berhasil ditambahkan.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── DELETE COMMENT ───────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan.' });
    }

    const isOwner = existing[0].user_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Tidak memiliki izin untuk menghapus komentar ini.' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Komentar berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getByLaporan, create, remove };