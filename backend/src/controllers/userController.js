const bcrypt = require('bcryptjs');
const db     = require('../config/database');

// ─── GET ALL USERS ────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── GET USER BY ID ───────────────────────────────────────
const getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, email, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── CREATE USER ─────────────────────────────────────────
const create = async (req, res) => {
  const { nama, email, password, role } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
  }

  const validRoles = ['user', 'admin', 'super_admin'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: `Role tidak valid. Pilih: ${validRoles.join(', ')}` });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)',
      [nama, email, hashed, role || 'user']
    );
    res.status(201).json({ message: 'User berhasil dibuat.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── UPDATE USER ─────────────────────────────────────────
const update = async (req, res) => {
  const { nama, email, password, role } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const fields = [];
    const params = [];

    if (nama)     { fields.push('nama = ?');     params.push(nama); }
    if (email)    { fields.push('email = ?');    params.push(email); }
    if (role)     { fields.push('role = ?');     params.push(role); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      params.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diubah.' });
    }

    params.push(req.params.id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'User berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── DELETE USER ─────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    // Tidak boleh hapus diri sendiri
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun sendiri.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };