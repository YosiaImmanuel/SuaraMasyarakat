const pool = require('../config/database');

/**
 * Create messages table untuk chat functionality
 * Run this once: node src/migrations/createMessagesTable.js
 */

async function createMessagesTable() {
  const connection = await pool.getConnection();
  try {
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
    console.log('✅ Messages table created successfully');
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ Messages table already exists');
    } else {
      console.error('❌ Error creating messages table:', error.message);
      throw error;
    }
  } finally {
    connection.release();
  }
}

createMessagesTable();
