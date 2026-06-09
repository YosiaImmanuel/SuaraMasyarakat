const pool = require('../config/database');

/**
 * Get all users for chat (excluding current user)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      `SELECT id, nama, email, role FROM users WHERE id != ? AND role != 'super_admin' ORDER BY role DESC, nama ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
};

/**
 * Get chat history between two users
 */
exports.getChatHistory = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.user.id;

    const [messages] = await pool.query(
      `SELECT 
        m.id, 
        m.sender_id, 
        m.receiver_id, 
        m.content, 
        m.created_at,
        u1.nama as sender_name,
        u2.nama as receiver_name
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      WHERE (
        (m.sender_id = ? AND m.receiver_id = ?) OR
        (m.sender_id = ? AND m.receiver_id = ?)
      )
      ORDER BY m.created_at ASC
      LIMIT 100`,
      [senderId, receiverId, receiverId, senderId]
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ success: false, message: 'Failed to get chat history' });
  }
};

/**
 * Get last message per conversation
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [conversations] = await pool.query(
      `SELECT 
        u.id AS user_id,
        u.nama,
        u.email,
        u.role,
        m.content AS last_message,
        m.created_at AS last_message_time
      FROM (
        SELECT 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END AS contact_id,
          MAX(id) AS max_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY contact_id
      ) AS last_msgs
      JOIN messages m ON last_msgs.max_id = m.id
      JOIN users u ON last_msgs.contact_id = u.id
      ORDER BY m.created_at DESC`,
      [userId, userId, userId]
    );

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversations' });
  }
};

/**
 * Search users by username
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    const [users] = await pool.query(
      `SELECT id, nama, email, role FROM users 
       WHERE id != ? AND role != 'super_admin' AND (nama LIKE ? OR email LIKE ?)
       ORDER BY role DESC, nama ASC
       LIMIT 20`,
      [userId, `%${query}%`, `%${query}%`]
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};

/**
 * Delete all messages between current user and another user
 */
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: targetUserId } = req.params;

    await pool.query(
      `DELETE FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)`,
      [userId, targetUserId, targetUserId, userId]
    );

    res.json({
      success: true,
      message: 'Percakapan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus percakapan' });
  }
};

/**
 * Save message to database (called via Socket.io, but can also be called via REST)
 */
exports.saveMessage = async (senderId, receiverId, content) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
      [senderId, receiverId, content]
    );

    const [message] = await pool.query(
      `SELECT m.*, u1.nama as sender_name, u2.nama as receiver_name
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    return message[0];
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};
