const db = require('../config/database');

/**
 * Helper to create a notification in database and optionally broadcast via Socket.io
 */
const createNotification = async (userId, type, title, message, referenceId = null, io = null) => {
  try {
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, reference_id, is_read) 
       VALUES (?, ?, ?, ?, ?, false)`,
      [userId, type, title, message, referenceId]
    );
    
    const notificationId = result.insertId;

    // Get the newly created notification
    const [rows] = await db.query(
      `SELECT * FROM notifications WHERE id = ?`,
      [notificationId]
    );

    const notification = rows[0];

    // Emit socket event if io is provided
    if (io) {
      console.log(`📡 Emitting newNotification to user_id ${userId}`);
      io.to(userId.toString()).emit('newNotification', notification);
    }

    return notification;
  } catch (error) {
    console.error('❌ Error in createNotification helper:', error);
    throw error;
  }
};

/**
 * Get all notifications for the current user
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

/**
 * Get unread notifications count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? AND is_read = false`,
      [userId]
    );
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('❌ Error getting unread notifications count:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

/**
 * Mark all notifications as read for current user
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query(
      `UPDATE notifications SET is_read = true 
       WHERE user_id = ?`,
      [userId]
    );
    res.json({ message: 'Semua notifikasi ditandai sebagai dibaca.' });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

/**
 * Mark specific notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    // Verify ownership
    const [existing] = await db.query(
      `SELECT id FROM notifications WHERE id = ? AND user_id = ?`,
      [notifId, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });
    }

    await db.query(
      `UPDATE notifications SET is_read = true WHERE id = ?`,
      [notifId]
    );

    res.json({ message: 'Notifikasi ditandai sebagai dibaca.' });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
};
