const db = require('../config/database');

// ─── GET ALL LAPORAN ──────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { status, category_id, search } = req.query;
    let query  = `
      SELECT l.*, u.nama AS nama_pelapor, c.nama AS kategori
      FROM laporan l
      JOIN users      u ON l.user_id     = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    if (category_id) {
      query += ' AND l.category_id = ?';
      params.push(category_id);
    }
    if (search) {
      query += ' AND (l.judul LIKE ? OR l.deskripsi LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY l.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── GET LAPORAN BY ID ────────────────────────────────────
const getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, u.nama AS nama_pelapor, c.nama AS kategori
       FROM laporan l
       JOIN users      u ON l.user_id     = u.id
       JOIN categories c ON l.category_id = c.id
       WHERE l.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── CREATE LAPORAN ───────────────────────────────────────
const create = async (req, res) => {
  const { category_id, judul, deskripsi, lokasi } = req.body;
  const gambar = req.file ? req.file.filename : null;

  if (!category_id || !judul || !deskripsi) {
    return res.status(400).json({ message: 'category_id, judul, dan deskripsi wajib diisi.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO laporan (user_id, category_id, judul, deskripsi, lokasi, gambar) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, category_id, judul, deskripsi, lokasi, gambar]
    );
    res.status(201).json({ message: 'Laporan berhasil dibuat.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── UPDATE LAPORAN ───────────────────────────────────────
const update = async (req, res) => {
  const { category_id, judul, deskripsi, lokasi } = req.body;
  const gambar = req.file ? req.file.filename : undefined;

  try {
    const [existing] = await db.query('SELECT * FROM laporan WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }

    // Hanya pemilik atau admin yang boleh edit
    const isOwner = existing[0].user_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Tidak memiliki izin untuk mengedit laporan ini.' });
    }

    const fields  = [];
    const params  = [];

    if (category_id) { fields.push('category_id = ?'); params.push(category_id); }
    if (judul)       { fields.push('judul = ?');       params.push(judul); }
    if (deskripsi)   { fields.push('deskripsi = ?');   params.push(deskripsi); }
    if (lokasi)      { fields.push('lokasi = ?');      params.push(lokasi); }
    if (gambar)      { fields.push('gambar = ?');      params.push(gambar); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diubah.' });
    }

    params.push(req.params.id);
    await db.query(`UPDATE laporan SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Laporan berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── UPDATE STATUS (admin only) ───────────────────────────
const updateStatus = async (req, res) => {
  const { status, rejection_reason } = req.body; // ← tambah rejection_reason
  const allowed = ['pending', 'approved', 'rejected'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Status harus salah satu dari: ${allowed.join(', ')}` });
  }

  // Kalau rejected, wajib ada alasan
  if (status === 'rejected' && !rejection_reason?.trim()) {
    return res.status(400).json({ message: 'Alasan penolakan wajib diisi.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM laporan WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }

    await db.query(
      'UPDATE laporan SET status = ?, rejection_reason = ? WHERE id = ?',
      [status, status === 'rejected' ? rejection_reason : null, req.params.id]
    );

    res.json({ message: `Status laporan berhasil diubah menjadi "${status}".` });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── DELETE LAPORAN ───────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM laporan WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    }

    const isOwner = existing[0].user_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Tidak memiliki izin untuk menghapus laporan ini.' });
    }

    await db.query('DELETE FROM laporan WHERE id = ?', [req.params.id]);
    res.json({ message: 'Laporan berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getAll, getById, create, update, updateStatus, remove };