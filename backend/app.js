const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');
const jwt     = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ─── MIDDLEWARE GLOBAL ────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Note: Uploads are now handled via Cloudinary

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth',       require('./src/routes/auth'));
app.use('/api/laporan',    require('./src/routes/laporan'));
app.use('/api/comments',   require('./src/routes/comment'));
app.use('/api/users',      require('./src/routes/user'));
app.use('/api/categories', require('./src/routes/category'));
app.use('/api/chat',       require('./src/routes/chat'));

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🟢 Backend Pengaduan Masyarakat berjalan.' });
});

// ─── SOCKET.IO MIDDLEWARE & EVENTS ────────────────────────
const chatController = require('./src/controllers/chatController');

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.user.nama || socket.user.email} (${socket.user.id})`);
  
  socket.join(socket.user.id.toString());

  socket.on('sendMessage', async ({ receiverId, content }) => {
    try {
      if (!receiverId || !content) return;
      const savedMessage = await chatController.saveMessage(socket.user.id, receiverId, content);
      
      // Emit to receiver
      io.to(receiverId.toString()).emit('receiveMessage', savedMessage);
      // Emit back to sender
      socket.emit('messageSent', savedMessage);
    } catch (err) {
      console.error('❌ Error handling sendMessage:', err.message);
    }
  });

  socket.on('typing', ({ receiverId }) => {
    if (receiverId) {
      socket.to(receiverId.toString()).emit('userTyping', { senderId: socket.user.id });
    }
  });

  socket.on('stopTyping', ({ receiverId }) => {
    if (receiverId) {
      socket.to(receiverId.toString()).emit('userStoppedTyping', { senderId: socket.user.id });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.user.id}`);
  });
});

// ─── 404 HANDLER ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Uncaught error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
  });
  res.status(500).json({
    message: 'Server error.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ─── START SERVER ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});