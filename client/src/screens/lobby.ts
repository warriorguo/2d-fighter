/**
 * Co-op lobby screen.
 */

import { GAME_WIDTH, GAME_HEIGHT, MAX_PLAYERS } from 'shared/constants.js';

const LEVEL_NAMES = [
  'Level 1 — Sky Assault',
  'Level 2 — Deep Space',
  'Level 3 — Crimson Nebula',
  'Level 4 — Event Horizon',
  'Level 5 — Final Frontier',
];

const LEVEL_COLORS = ['#44cc88', '#44aacc', '#cc6644', '#4488cc', '#ccaa44'];

export interface LobbyState {
  roomCode: string;
  inputCode: string;
  connected: boolean;
  playerCount: number;
  maxPlayers: number;
  mode: 'none' | 'create_setup' | 'creating' | 'joining' | 'waiting';
  error: string;
  menuSelection: number; // 0 = Create, 1 = Join
  levelSelection: number;
}

export function createLobbyState(): LobbyState {
  return {
    roomCode: '',
    inputCode: '',
    connected: false,
    playerCount: 0,
    maxPlayers: 2,
    mode: 'none',
    error: '',
    menuSelection: 0,
    levelSelection: 0,
  };
}

export function getLobbyLevelCount(): number {
  return LEVEL_NAMES.length;
}

export function drawLobby(ctx: CanvasRenderingContext2D, state: LobbyState, tick: number): void {
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#00ccff';
  ctx.fillText('CO-OP LOBBY', GAME_WIDTH / 2, 60);

  if (state.mode === 'none') {
    // Simple Create / Join choice
    const options = ['Create Room', 'Join Room'];
    for (let i = 0; i < options.length; i++) {
      const y = 260 + i * 50;
      const selected = i === state.menuSelection;
      ctx.font = selected ? 'bold 20px monospace' : '16px monospace';
      ctx.fillStyle = selected ? '#ffffff' : '#666666';
      if (selected) {
        const bounce = Math.sin(tick * 0.1) * 2;
        ctx.fillText(`> ${options[i]} <`, GAME_WIDTH / 2 + bounce, y);
      } else {
        ctx.fillText(options[i], GAME_WIDTH / 2, y);
      }
    }
    ctx.font = '11px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Up/Down + Enter to select, Esc to go back', GAME_WIDTH / 2, 400);
  } else if (state.mode === 'create_setup') {
    // Level selection
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText('Select Level:', GAME_WIDTH / 2, 100);

    for (let i = 0; i < LEVEL_NAMES.length; i++) {
      const y = 130 + i * 28;
      const selected = i === state.levelSelection;
      ctx.font = selected ? 'bold 14px monospace' : '12px monospace';
      ctx.fillStyle = selected ? '#ffffff' : LEVEL_COLORS[i];
      if (selected) {
        const bounce = Math.sin(tick * 0.1) * 2;
        ctx.fillText(`> ${LEVEL_NAMES[i]} <`, GAME_WIDTH / 2 + bounce, y);
      } else {
        ctx.fillText(LEVEL_NAMES[i], GAME_WIDTH / 2, y);
      }
    }

    // Player count selector
    ctx.font = '12px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText('Players:', GAME_WIDTH / 2, 305);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#ffaa44';
    ctx.fillText(`< ${state.maxPlayers} >`, GAME_WIDTH / 2, 330);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Left/Right to change (2-4)', GAME_WIDTH / 2, 352);

    // Confirm
    ctx.font = '16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Enter — Create Room', GAME_WIDTH / 2, 400);
    ctx.font = '11px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Up/Down: level, Left/Right: players, Esc: back', GAME_WIDTH / 2, 440);
  } else if (state.mode === 'creating' || state.mode === 'waiting') {
    // Show selected level
    ctx.font = '13px monospace';
    ctx.fillStyle = LEVEL_COLORS[state.levelSelection];
    ctx.fillText(LEVEL_NAMES[state.levelSelection], GAME_WIDTH / 2, 120);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Room Code:', GAME_WIDTH / 2, 220);
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(state.roomCode || '...', GAME_WIDTH / 2, 260);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText(`Players: ${state.playerCount}/${state.maxPlayers}`, GAME_WIDTH / 2, 310);
    const remaining = state.maxPlayers - state.playerCount;
    const alpha = Math.abs(Math.sin(tick * 0.05));
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText(remaining > 0 ? `Waiting for ${remaining} more player${remaining > 1 ? 's' : ''}...` : 'Starting...', GAME_WIDTH / 2, 350);
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
    ctx.font = '11px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Level & players set by room creator', GAME_WIDTH / 2, 350);
  }

  if (state.error) {
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ff4444';
    ctx.fillText(state.error, GAME_WIDTH / 2, 460);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
