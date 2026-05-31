const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/database');

// ─── REGISTER ────────────────────────────────────────────
const register = async (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'Nama, email, dan password wajib diisi.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal terdiri dari 6 karakter.' });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ message: 'Password minimal harus mengandung satu huruf besar.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (nama, email, password) VALUES (?, ?, ?)',
      [nama, email, hashed]
    );

    res.status(201).json({ message: 'Registrasi berhasil. Silakan login.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const user    = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login berhasil.',
      token,
      user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── GET PROFILE ─────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ─── UPDATE PROFILE ──────────────────────────────────────
const updateProfile = async (req, res) => {
  const { nama, email, password, current_password } = req.body;
  const userId = req.user.id;

  if (!nama || !email) {
    return res.status(400).json({ message: 'Nama dan email wajib diisi.' });
  }

  try {
    // Check if email is already taken by another user
    const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email sudah digunakan oleh akun lain.' });
    }

    if (password) {
      // Wajib ada current_password kalau mau ganti password
      if (!current_password) {
        return res.status(400).json({ message: 'Kata sandi saat ini wajib diisi untuk mengganti kata sandi.' });
      }

      // Ambil password lama dari DB
      const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
      const isMatch = await bcrypt.compare(current_password, rows[0].password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Kata sandi saat ini tidak sesuai.' });
      }

      // Validasi password baru
      if (password.length < 6) {
        return res.status(400).json({ message: 'Kata sandi minimal harus terdiri dari 6 karakter.' });
      }
      if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ message: 'Kata sandi harus mengandung minimal satu huruf besar (A-Z).' });
      }

      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET nama = ?, email = ?, password = ? WHERE id = ?',
        [nama, email, hashed, userId]
      );
    } else {
      await db.query(
        'UPDATE users SET nama = ?, email = ? WHERE id = ?',
        [nama, email, userId]
      );
    }

    res.json({ message: 'Profil berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };