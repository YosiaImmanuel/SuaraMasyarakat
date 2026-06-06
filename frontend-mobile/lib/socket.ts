import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/constants/api";

let socket: Socket | null = null;

const SOCKET_URL = API_BASE_URL.replace("/api", "");

export const initializeSocket = (token: string) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    socket?.emit("authenticate", token);
  });

  socket.on("disconnect", () => {});

  socket.on("error", (error) => {});

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const sendMessage = (receiverId: number, content: string) => {
  if (socket) {
    socket.emit("sendMessage", { receiverId, content });
  }
};

export const setTyping = (receiverId: number) => {
  if (socket) {
    socket.emit("typing", { receiverId });
  }
};

export const setStopTyping = (receiverId: number) => {
  if (socket) {
    socket.emit("stopTyping", { receiverId });
  }
};

export const onReceiveMessage = (callback: (data: any) => void) => {
  if (socket) {
    socket.off("receiveMessage");
    socket.on("receiveMessage", callback);
  }
};

export const onMessageSent = (callback: (data: any) => void) => {
  if (socket) {
    socket.off("messageSent");
    socket.on("messageSent", callback);
  }
};

export const onUserTyping = (callback: (data: any) => void) => {
  if (socket) {
    socket.off("userTyping");
    socket.on("userTyping", callback);
  }
};

export const onUserStoppedTyping = (callback: (data: any) => void) => {
  if (socket) {
    socket.off("userStoppedTyping");
    socket.on("userStoppedTyping", callback);
  }
};
