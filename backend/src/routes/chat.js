const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.get('/users', verifyToken, chatController.getAllUsers);
router.get('/search', verifyToken, chatController.searchUsers);
router.get('/conversations', verifyToken, chatController.getConversations);
router.get('/history/:receiverId', verifyToken, chatController.getChatHistory);

module.exports = router;
