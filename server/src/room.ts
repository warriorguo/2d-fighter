/**
 * Room management: create, join, state machine.
 */

import type { WebSocket } from 'ws';

export type RoomState = 'waiting' | 'playing' | 'finished';

export interface Room {
  code: string;
  state: RoomState;
  players: WebSocket[];
  playerIds: Map<WebSocket, number>;
  seed: number;
  levelIndex: number;
  maxPlayers: number;
  tickInputs: Map<number, Map<number, number>>; // tick → (playerId → inputBits)
}

const rooms = new Map<string, Room>();
const playerRooms = new Map<WebSocket, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[(Math.random() * chars.length) | 0];
  }
  return code;
}

export function createRoom(ws: WebSocket, levelIndex: number = 0, maxPlayers: number = 2): Room {
  let code = generateCode();
  while (rooms.has(code)) {
    code = generateCode();
  }

  const room: Room = {
    code,
    state: 'waiting',
    players: [ws],
    playerIds: new Map([[ws, 0]]),
    seed: (Math.random() * 0xFFFFFFFF) | 0,
    levelIndex,
    maxPlayers: Math.max(2, Math.min(4, maxPlayers)),
    tickInputs: new Map(),
  };

  rooms.set(code, room);
  playerRooms.set(ws, room);
  return room;
}

export function joinRoom(ws: WebSocket, code: string): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  if (room.state !== 'waiting') return null;
  if (room.players.length >= room.maxPlayers) return null;

  const playerId = room.players.length;
  room.players.push(ws);
  room.playerIds.set(ws, playerId);
  playerRooms.set(ws, room);
  return room;
}

export function removePlayer(ws: WebSocket): void {
  const room = playerRooms.get(ws);
  if (!room) return;

  room.players = room.players.filter(p => p !== ws);
  room.playerIds.delete(ws);
  playerRooms.delete(ws);

  if (room.players.length === 0) {
    rooms.delete(room.code);
  } else {
    room.state = 'finished';
  }
}

export function getPlayerRoom(ws: WebSocket): Room | null {
  return playerRooms.get(ws) || null;
}

export function getPlayerId(ws: WebSocket): number {
  const room = playerRooms.get(ws);
  return room?.playerIds.get(ws) ?? -1;
}
