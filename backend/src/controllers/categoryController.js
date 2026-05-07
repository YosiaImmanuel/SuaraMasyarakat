const db = require('../config/database');

// ─── GET ALL ──────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────
const create = async (req, res) => {
  const { nama } = req.body;
  if (!nama) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });

  try {
    const [result] = await db.query('INSERT INTO categories (nama) VALUES (?)', [nama]);
    res.status(201).json({ message: 'Kategori berhasil ditambahkan.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────
const update = async (req, res) => {
  const { nama } = req.body;
  if (!nama) return res.status(400).json({ message: 'Nama kategori wajib diisi.' });

  try {
    const [existing] = await db.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });

    await db.query('UPDATE categories SET nama = ? WHERE id = ?', [nama, req.params.id]);
    res.json({ message: 'Kategori berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan.' });

    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Kategori berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getAll, create, update, remove };