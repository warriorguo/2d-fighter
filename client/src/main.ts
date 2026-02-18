/**
 * Main entry point — boots game, manages screens and game loop.
 */

import { GameSimulation } from 'shared/simulation.js';
import { GAME_WIDTH, GAME_HEIGHT, TICK_MS, MAX_PLAYERS } from 'shared/constants.js';
import { createPlayer } from 'shared/factory.js';
import { createMovementSystem } from 'shared/systems/movement.js';
import { createShootingSystem } from 'shared/systems/shooting.js';
import { createCollisionSystem } from 'shared/systems/collision.js';
import { cleanupSystem } from 'shared/systems/cleanup.js';
import { enemyAISystem } from 'shared/systems/enemy-ai.js';
import { createBulletPatternSystem } from 'shared/systems/bullet-pattern.js';
import { dropSystem } from 'shared/systems/drop.js';
import { createWaveSystem, createWaveState, type WaveState } from 'shared/systems/wave.js';
import { createScoreSystem, createScoreState, type ScoreState } from 'shared/systems/score.js';
import { createBossSystem, createBossState, type BossState } from 'shared/systems/boss.js';
import type { LevelConfig } from 'shared/config/types.js';
import type { PlayerInput } from 'shared/input.js';
import { emptyInput } from 'shared/input.js';

import { Renderer } from './renderer.js';
import { initInput, captureInput } from './input.js';
import { ParallaxBackground } from './parallax.js';
import { HUD } from './ui.js';
import { createScreenState, type Screen } from './screens/types.js';
import { drawMenu, getMenuOptionCount } from './screens/menu.js';
import { drawResults } from './screens/results.js';
import { drawPause, getPauseOptionCount } from './screens/pause.js';
import { drawControls } from './screens/controls.js';
import { createLobbyState, drawLobby, getLobbyLevelCount, type LobbyState } from './screens/lobby.js';
import { NetworkClient } from './net/client.js';
import { LockstepManager } from './net/lockstep.js';
import { DebugOverlay } from './debug-overlay.js';

import level1Data from '../../data/levels/level1.json';
import level2Data from '../../data/levels/level2.json';
import level3Data from '../../data/levels/level3.json';
import level4Data from '../../data/levels/level4.json';
import level5Data from '../../data/levels/level5.json';

const LEVELS: LevelConfig[] = [
  level1Data as LevelConfig,
  level2Data as LevelConfig,
  level3Data as LevelConfig,
  level4Data as LevelConfig,
  level5Data as LevelConfig,
];
let selectedLevel = 0;

// Game state
let sim: GameSimulation | null = null;
let waveState: WaveState | null = null;
let scoreState: ScoreState | null = null;
let bossState: BossState | null = null;
let renderer: Renderer;
let parallax: ParallaxBackground;
let hud: HUD;
let screenState = createScreenState();
let lobbyState = createLobbyState();
let networkClient: NetworkClient | null = null;
let lockstep: LockstepManager | null = null;
let isCoopMode = false;
let debugOverlay = new DebugOverlay();
let menuTick = 0;
let paused = false;
let pauseSelection = 0;

// Fixed timestep accumulator
let lastTime = 0;
let accumulator = 0;

function init(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  renderer = new Renderer(canvas);
  parallax = new ParallaxBackground();
  hud = new HUD();
  initInput();
  initMenuKeys();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function initMenuKeys(): void {
  window.addEventListener('keydown', (e) => {
    // F1 toggles debug mode globally
    if (e.code === 'F1') {
      e.preventDefault();
      debugOverlay.toggle();
      return;
    }

    if (screenState.current === 'menu') {
      handleMenuKey(e);
    } else if (screenState.current === 'pause') {
      handlePauseKey(e);
    } else if (screenState.current === 'results') {
      if (e.code === 'Enter') {
        screenState.current = 'menu';
        screenState.menuSelection = 0;
        sim = null;
      }
    } else if (screenState.current === 'game') {
      if (e.code === 'Escape') {
        enterPause();
      }
    } else if ((screenState.current as string) === 'controls') {
      if (e.code === 'Escape') {
        screenState.current = 'menu';
      }
    } else if (screenState.current === 'lobby') {
      handleLobbyKey(e);
    }
  });
}

function handleMenuKey(e: KeyboardEvent): void {
  const optionCount = getMenuOptionCount();
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      screenState.menuSelection = (screenState.menuSelection - 1 + optionCount) % optionCount;
      break;
    case 'ArrowDown':
    case 'KeyS':
      screenState.menuSelection = (screenState.menuSelection + 1) % optionCount;
      break;
    case 'Enter':
    case 'Space': {
      const sel = screenState.menuSelection;
      if (sel < LEVELS.length) {
        // Level selection
        isCoopMode = false;
        selectedLevel = sel;
        startGame(1);
      } else if (sel === LEVELS.length) {
        // Co-op
        screenState.current = 'lobby';
        lobbyState = createLobbyState();
      } else if (sel === LEVELS.length + 1) {
        // Controls
        screenState.current = 'controls' as Screen;
      }
      break;
    }
  }
}

function handleLobbyKey(e: KeyboardEvent): void {
  if (e.code === 'Escape') {
    if (networkClient) {
      networkClient.disconnect();
      networkClient = null;
    }
    if (lobbyState.mode === 'none') {
      screenState.current = 'menu';
    } else {
      lobbyState.mode = 'none';
      lobbyState.error = '';
    }
    return;
  }

  if (lobbyState.mode === 'none') {
    const levelCount = getLobbyLevelCount();
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      lobbyState.levelSelection = (lobbyState.levelSelection - 1 + levelCount) % levelCount;
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      lobbyState.levelSelection = (lobbyState.levelSelection + 1) % levelCount;
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      lobbyState.maxPlayers = Math.max(2, lobbyState.maxPlayers - 1);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      lobbyState.maxPlayers = Math.min(MAX_PLAYERS, lobbyState.maxPlayers + 1);
    } else if (e.code === 'KeyC') {
      selectedLevel = lobbyState.levelSelection;
      lobbyState.mode = 'creating';
      connectAndCreateRoom();
    } else if (e.code === 'KeyJ') {
      lobbyState.mode = 'joining';
      lobbyState.inputCode = '';
    }
  } else if (lobbyState.mode === 'joining') {
    if (e.code === 'Enter' && lobbyState.inputCode.length > 0) {
      connectAndJoinRoom(lobbyState.inputCode);
    } else if (e.code === 'Backspace') {
      lobbyState.inputCode = lobbyState.inputCode.slice(0, -1);
    } else if (e.key.length === 1 && /[A-Za-z0-9]/.test(e.key) && lobbyState.inputCode.length < 6) {
      lobbyState.inputCode += e.key.toUpperCase();
    }
  }
}

function enterPause(): void {
  if (isCoopMode) return; // co-op doesn't support pause (lockstep would desync)
  paused = true;
  pauseSelection = 0;
  screenState.current = 'pause';
}

function resumeGame(): void {
  paused = false;
  screenState.current = 'game';
  // Reset accumulator to avoid tick burst after unpause
  lastTime = performance.now();
  accumulator = 0;
}

function handlePauseKey(e: KeyboardEvent): void {
  const optionCount = getPauseOptionCount();
  switch (e.code) {
    case 'Escape':
      resumeGame();
      break;
    case 'ArrowUp':
    case 'KeyW':
      pauseSelection = (pauseSelection - 1 + optionCount) % optionCount;
      break;
    case 'ArrowDown':
    case 'KeyS':
      pauseSelection = (pauseSelection + 1) % optionCount;
      break;
    case 'Enter':
    case 'Space':
      switch (pauseSelection) {
        case 0: // Resume
          resumeGame();
          break;
        case 1: // Restart
          paused = false;
          if (sim) {
            startGame(sim.config.playerCount, undefined);
          }
          break;
        case 2: // Quit to Menu
          paused = false;
          sim = null;
          screenState.current = 'menu';
          screenState.menuSelection = 0;
          break;
      }
      break;
  }
}

function connectAndCreateRoom(): void {
  networkClient = new NetworkClient();
  networkClient.onRoomCreated = (code, maxPlayers) => {
    lobbyState.roomCode = code;
    lobbyState.playerCount = 1;
    lobbyState.maxPlayers = maxPlayers;
    lobbyState.mode = 'waiting';
  };
  networkClient.onPlayerJoined = (count, maxPlayers) => {
    lobbyState.playerCount = count;
    lobbyState.maxPlayers = maxPlayers;
  };
  // Both creator and joiner start from the server's game_start message
  // so they share the same seed and get correct playerIds
  networkClient.onGameStart = (seed, playerId, playerCount, levelIndex) => {
    isCoopMode = true;
    selectedLevel = levelIndex;
    startCoopGame(seed, playerId, playerCount);
  };
  networkClient.onError = (msg) => {
    lobbyState.error = msg;
  };
  networkClient.connect().then(() => {
    networkClient!.createRoom(selectedLevel, lobbyState.maxPlayers);
  }).catch(() => {
    lobbyState.error = 'Failed to connect to server';
  });
}

function connectAndJoinRoom(code: string): void {
  networkClient = new NetworkClient();
  networkClient.onGameStart = (seed, playerId, playerCount, levelIndex) => {
    isCoopMode = true;
    selectedLevel = levelIndex;
    startCoopGame(seed, playerId, playerCount);
  };
  networkClient.onError = (msg) => {
    lobbyState.error = msg;
  };
  networkClient.connect().then(() => {
    networkClient!.joinRoom(code);
  }).catch(() => {
    lobbyState.error = 'Failed to connect to server';
  });
}

function startGame(playerCount: number, seed?: number): void {
  const level = LEVELS[selectedLevel];
  const gameSeed = seed ?? (Date.now() & 0xFFFFFFFF);

  sim = new GameSimulation({
    seed: gameSeed,
    playerCount,
    levelId: level.id,
  });

  // Create players
  for (let i = 0; i < playerCount; i++) {
    createPlayer(sim.world, i, playerCount);
  }

  // Init states
  waveState = createWaveState(level);
  scoreState = createScoreState();
  bossState = createBossState(level.boss);

  // Register systems in order
  sim.addSystem(createMovementSystem(sim));
  sim.addSystem(enemyAISystem);
  sim.addSystem(createShootingSystem(sim));
  sim.addSystem(createBulletPatternSystem(sim));
  sim.addSystem(createCollisionSystem(sim));
  sim.addSystem(dropSystem);
  sim.addSystem(createWaveSystem(sim, waveState));
  sim.addSystem(createScoreSystem(scoreState, waveState));
  sim.addSystem(createBossSystem(sim, waveState, bossState));
  sim.addSystem(cleanupSystem);

  // Init parallax
  parallax.init(level.background.layers);

  paused = false;
  screenState.current = 'game';
  accumulator = 0;
  lastTime = performance.now();
}

function startCoopGame(seed: number, playerId: number, playerCount: number): void {
  if (networkClient) {
    lockstep = new LockstepManager(networkClient, playerId);
  }
  startGame(playerCount, seed);
}

function loop(now: number): void {
  const dt = now - lastTime;
  lastTime = now;
  menuTick++;

  const ctx = renderer.ctx;

  switch (screenState.current) {
    case 'menu':
      drawMenu(ctx, screenState.menuSelection, menuTick);
      break;

    case 'lobby':
      drawLobby(ctx, lobbyState, menuTick);
      break;

    case 'game':
      updateGame(dt);
      renderGame();
      break;

    case 'pause':
      renderGame();
      drawPause(ctx, pauseSelection, menuTick);
      break;

    case 'results':
      renderGame();
      drawResults(ctx, screenState.results?.victory ?? false, screenState.results?.scores ?? [0], menuTick, screenState.results?.levelName);
      break;

    default:
      // Controls screen
      drawControls(ctx);
      break;
  }

  requestAnimationFrame(loop);
}

function updateGame(dt: number): void {
  if (!sim || paused) return;

  accumulator += dt;

  // Cap accumulator to prevent spiral of death
  if (accumulator > TICK_MS * 5) {
    accumulator = TICK_MS * 5;
  }

  while (accumulator >= TICK_MS) {
    accumulator -= TICK_MS;

    const localInput = captureInput();

    if (isCoopMode && lockstep) {
      // Networked: use lockstep
      lockstep.setLocalInput(sim.world.tick, localInput);
      const inputs = lockstep.getInputsForTick(sim.world.tick);
      if (!inputs) {
        // Waiting for remote input, stall
        accumulator = 0;
        break;
      }
      sim.step(inputs);
    } else {
      // Single player
      sim.step([localInput]);
    }

    // Check game over conditions
    checkGameState();
  }
}

function checkGameState(): void {
  if (!sim || !waveState || !bossState) return;

  const levelName = LEVELS[selectedLevel].name;

  // Victory
  if (waveState.levelComplete) {
    const scores: number[] = [];
    for (const [, tag] of sim.world.playerTag) {
      scores.push(tag.score);
    }
    screenState.results = { victory: true, scores, levelName };
    screenState.current = 'results';
    return;
  }

  // Game over — all players dead
  let allDead = true;
  const scores: number[] = [];
  for (const [entity, tag] of sim.world.playerTag) {
    scores.push(tag.score);
    const hp = sim.world.health.get(entity);
    if (hp && hp.current > 0) allDead = false;
  }

  if (allDead) {
    screenState.results = { victory: false, scores, levelName };
    screenState.current = 'results';
  }
}

function renderGame(): void {
  if (!sim || !waveState || !scoreState || !bossState) return;

  // Background (don't scroll when paused)
  if (!paused) parallax.update();
  parallax.draw(renderer.ctx);

  // Game world
  renderer.drawWorld(sim.world);

  // HUD
  hud.draw(renderer.ctx, sim.world, scoreState, bossState, waveState);

  // Debug overlay (F1)
  debugOverlay.draw(renderer.ctx, sim.world, scoreState, waveState, bossState);
}

// Boot
init();
