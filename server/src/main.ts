/**
 * Server entry point: HTTP + WebSocket for co-op relay.
 * Also serves client static files in production mode.
 */

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createRoom, joinRoom, removePlayer, getPlayerRoom, getPlayerId } from './room.js';
import { handleTickInput } from './relay.js';
import { isValidRoomCode, isValidTick, isValidInputBits, isValidSeed } from './validation.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const PUBLIC_DIR = process.env.PUBLIC_DIR || '';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const httpServer = createServer((req, res) => {
  // If no PUBLIC_DIR, just return a health check
  if (!PUBLIC_DIR) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('2D Fighter Server');
    return;
  }

  // Serve static files
  const url = req.url?.split('?')[0] || '/';
  let filePath = join(PUBLIC_DIR, url === '/' ? 'index.html' : url);

  // If path doesn't exist or is a directory, try index.html (SPA fallback)
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(PUBLIC_DIR, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', (data: Buffer) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'create_room': {
        const levelIdx = typeof msg.levelIndex === 'number' ? (msg.levelIndex | 0) : 0;
        const maxP = typeof msg.maxPlayers === 'number' ? (msg.maxPlayers | 0) : 2;
        const room = createRoom(ws, levelIdx, maxP);
        ws.send(JSON.stringify({
          type: 'room_created',
          code: room.code,
          maxPlayers: room.maxPlayers,
        }));
        console.log(`Room created: ${room.code} (level ${levelIdx}, ${room.maxPlayers}P)`);
        break;
      }

      case 'join_room': {
        if (!isValidRoomCode(msg.code)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid room code' }));
          break;
        }
        const room = joinRoom(ws, msg.code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found or full' }));
          break;
        }

        console.log(`Player joined room: ${room.code}`);

        // Notify all players
        for (const player of room.players) {
          player.send(JSON.stringify({
            type: 'player_joined',
            count: room.players.length,
            maxPlayers: room.maxPlayers,
          }));
        }

        // If room is full, start the game
        if (room.players.length >= room.maxPlayers) {
          room.state = 'playing';
          for (const player of room.players) {
            const playerId = room.playerIds.get(player) ?? 0;
            player.send(JSON.stringify({
              type: 'game_start',
              seed: room.seed,
              playerId,
              playerCount: room.players.length,
              levelIndex: room.levelIndex,
            }));
          }
        }
        break;
      }

      case 'tick_input': {
        const room = getPlayerRoom(ws);
        if (!room || room.state !== 'playing') break;
        if (!isValidTick(msg.tick) || !isValidInputBits(msg.input)) break;
        handleTickInput(room, ws, msg.tick, msg.input);
        break;
      }

      case 'game_start': {
        break;
      }
    }
  });

  ws.on('close', () => {
    const room = getPlayerRoom(ws);
    if (room) {
      console.log(`Player left room: ${room.code}`);
      removePlayer(ws);
      for (const player of room.players) {
        player.send(JSON.stringify({
          type: 'error',
          message: 'Other player disconnected',
        }));
      }
    }
    console.log('Client disconnected');
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
  if (PUBLIC_DIR) {
    console.log(`Serving static files from ${PUBLIC_DIR}`);
  }
});
