import { SOCKET_EVENTS } from './events.js';

export function registerSocketHandlers(socket) {
  const userId = socket.data.user.id;
  socket.join(`user:${userId}`);
  socket.emit(SOCKET_EVENTS.CONNECTION_READY, { userId, role: socket.data.user.role });
}
