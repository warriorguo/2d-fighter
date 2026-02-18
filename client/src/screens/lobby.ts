/**
 * Co-op lobby screen.
 */

import { GAME_WIDTH, GAME_HEIGHT } from 'shared/constants.js';

export interface LobbyState {
  roomCode: string;
  inputCode: string;
  connected: boolean;
  playerCount: number;
  mode: 'none' | 'creating' | 'joining' | 'waiting';
  error: string;
}

export function createLobbyState(): LobbyState {
  return {
    roomCode: '',
    inputCode: '',
    connected: false,
    playerCount: 0,
    mode: 'none',
    error: '',
  };
}

export function drawLobby(ctx: CanvasRenderingContext2D, state: LobbyState, tick: number): void {
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#00ccff';
  ctx.fillText('CO-OP LOBBY', GAME_WIDTH / 2, 80);

  if (state.mode === 'none') {
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Press C to Create Room', GAME_WIDTH / 2, 240);
    ctx.fillText('Press J to Join Room', GAME_WIDTH / 2, 280);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Press Esc to go back', GAME_WIDTH / 2, 340);
  } else if (state.mode === 'creating' || state.mode === 'waiting') {
    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Room Code:', GAME_WIDTH / 2, 220);
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(state.roomCode || '...', GAME_WIDTH / 2, 260);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText(`Players: ${state.playerCount}/2`, GAME_WIDTH / 2, 310);
    const alpha = Math.abs(Math.sin(tick * 0.05));
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText('Waiting for player 2...', GAME_WIDTH / 2, 350);
  } else if (state.mode === 'joining') {
    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Enter Room Code:', GAME_WIDTH / 2, 220);
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.inputCode + '_', GAME_WIDTH / 2, 260);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText('Press Enter to join', GAME_WIDTH / 2, 310);
  }

  if (state.error) {
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ff4444';
    ctx.fillText(state.error, GAME_WIDTH / 2, 420);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
