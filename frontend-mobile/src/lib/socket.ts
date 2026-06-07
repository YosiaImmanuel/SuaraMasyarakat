import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/src/constants/api';

let socket: Socket | null = null;

export function initializeSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function sendMessage(receiverId: number, content: string): void {
  if (socket?.connected) {
    socket.emit('sendMessage', { receiverId, content });
  }
}

export function setTyping(receiverId: number): void {
  socket?.emit('typing', { receiverId });
}

export function setStopTyping(receiverId: number): void {
  socket?.emit('stopTyping', { receiverId });
}
