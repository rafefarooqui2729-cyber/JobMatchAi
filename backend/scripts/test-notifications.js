import assert from 'node:assert/strict';
import test from 'node:test';
import { registerSocketHandlers } from '../src/sockets/handlers.js';

test('realtime notifications join only the room for the authenticated user', () => {
  const rooms = [];
  const emitted = [];
  const socket = {
    data: { user: { id: 'candidate-123', role: 'candidate' } },
    join(room) { rooms.push(room); },
    emit(event, payload) { emitted.push({ event, payload }); },
  };

  registerSocketHandlers(socket);

  assert.deepEqual(rooms, ['user:candidate-123']);
  assert.deepEqual(emitted, [{
    event: 'connection:ready',
    payload: { userId: 'candidate-123', role: 'candidate' },
  }]);
  assert.equal(rooms.includes('user:undefined'), false);
});

test('different authenticated users cannot share the same notification room', () => {
  const roomFor = (id) => {
    const rooms = [];
    registerSocketHandlers({
      data: { user: { id, role: 'candidate' } },
      join(room) { rooms.push(room); },
      emit() {},
    });
    return rooms[0];
  };

  assert.notEqual(roomFor('candidate-a'), roomFor('candidate-b'));
});
