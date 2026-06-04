const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDb() {
  // Connect without database first to create the database if not exists
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  console.log('🔌 Connecting to MySQL server at', connectionConfig.host);
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    process.exit(1);
  }

  try {
    const dbName = process.env.DB_NAME || 'db_pengaduan';
    console.log(`🔨 Creating database if not exists: ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    console.log('🔨 Creating table: users...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('🔨 Creating table: categories...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nama VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('🔨 Creating table: laporan...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS laporan (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        judul VARCHAR(200) NOT NULL,
        deskripsi TEXT NOT NULL,
        lokasi VARCHAR(255),
        gambar VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    console.log('🔨 Creating table: comments...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        laporan_id INT NOT NULL,
        user_id INT NOT NULL,
        isi TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (laporan_id) REFERENCES laporan(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('🔨 Creating table: messages...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_sender_receiver (sender_id, receiver_id),
        INDEX idx_created_at (created_at)
      )
    `);

    // Check if seeds already exist
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log('🌱 Seeding users table...');
      await connection.query(`
        INSERT INTO users (nama, email, password, role) VALUES
        (
          'Super Admin',
          'superadmin@gmail.com',
          '$2a$10$nfv.YyedJV92Cu3LzlRL.erDYbdDY8XT9K/Mb9j6av.E/zAc191g.',
          'super_admin'
        ),
        (
          'Admin Kota',
          'admin@gmail.com',
          '$2a$10$9Sgd6kGSs61eGMg8GOjVFuEkwy/gSjDflbuJM4CcTAdw8fLOXtmg2',
          'admin'
        )
      `);
    } else {
      console.log('ℹ️ Users table already contains data, skipping user seeding.');
    }

    const [existingCategories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (existingCategories[0].count === 0) {
      console.log('🌱 Seeding categories table...');
      await connection.query(`
        INSERT INTO categories (nama) VALUES
        ('Infrastruktur Jalan'),
        ('Kebersihan & Sampah'),
        ('Keamanan Lingkungan'),
        ('Pelayanan Publik'),
        ('Fasilitas Umum'),
        ('Lainnya')
      `);
    } else {
      console.log('ℹ️ Categories table already contains data, skipping category seeding.');
    }

    console.log('✅ Database and all tables initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDb();
