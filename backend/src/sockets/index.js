import { Server } from 'socket.io';
import env from '../config/env.js';
import { getAuthenticatedUser, verifyAccessToken } from '../services/auth.service.js';
import { registerSocketHandlers } from './handlers.js';

let socketServer;

function sessionToken(cookieHeader = '') {
  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('jobmatch_session='));
  if (!cookie) return null;
  try {
    return decodeURIComponent(cookie.slice('jobmatch_session='.length));
  } catch {
    return null;
  }
}

export function attachSocketServer(httpServer) {
  socketServer = new Server(httpServer, {
    path: '/api/socket.io',
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
    allowRequest(request, callback) {
      const origin = request.headers.origin;
      callback(null, !origin || origin === env.clientOrigin);
    },
  });

  socketServer.use(async (socket, next) => {
    const token = sessionToken(socket.handshake.headers.cookie);
    if (!token) {
      next(new Error('Authentication required.'));
      return;
    }
    let claims;
    try {
      claims = verifyAccessToken(token);
    } catch {
      next(new Error('Authentication required.'));
      return;
    }
    try {
      const user = await getAuthenticatedUser(claims.sub);
      if (!user || user.role !== claims.role) {
        next(new Error('Authentication required.'));
        return;
      }
      socket.data.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication lookup failed.', { name: error.name });
      next(new Error('Connection authentication is temporarily unavailable.'));
    }
  });

  socketServer.on('connection', registerSocketHandlers);
  return socketServer;
}

export function emitToUser(userId, eventName, payload) {
  if (!socketServer) return false;
  socketServer.to(`user:${userId}`).emit(eventName, payload);
  return true;
}

export function disconnectUserSockets(userId) {
  socketServer?.in(`user:${userId}`).disconnectSockets(true);
}
