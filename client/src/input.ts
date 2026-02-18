/**
 * Keyboard input capture → PlayerInput.
 */

import type { PlayerInput } from 'shared/input.js';

const keys = new Set<string>();

export function initInput(): void {
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    // Prevent arrow key scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });
  // Clear on blur to avoid stuck keys
  window.addEventListener('blur', () => {
    keys.clear();
  });
}

export function captureInput(): PlayerInput {
  return {
    up: keys.has('ArrowUp') || keys.has('KeyW'),
    down: keys.has('ArrowDown') || keys.has('KeyS'),
    left: keys.has('ArrowLeft') || keys.has('KeyA'),
    right: keys.has('ArrowRight') || keys.has('KeyD'),
    shoot: keys.has('Space') || keys.has('KeyZ'),
    bomb: keys.has('KeyX') || keys.has('KeyB'),
    slow: keys.has('ShiftLeft') || keys.has('ShiftRight'),
  };
}
