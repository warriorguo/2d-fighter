/**
 * Debug event log — records game events for the debug overlay.
 * Only active when enabled; zero overhead when off.
 */

export interface DebugEvent {
  tick: number;
  time: number;     // performance.now() or 0 on server
  category: string;
  message: string;
}

class DebugLog {
  enabled = false;
  events: DebugEvent[] = [];
  maxEvents = 200;

  private _tick = 0;

  setTick(tick: number): void {
    this._tick = tick;
  }

  log(category: string, message: string): void {
    if (!this.enabled) return;
    this.events.push({
      tick: this._tick,
      time: typeof performance !== 'undefined' ? performance.now() : 0,
      category,
      message,
    });
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }

  clear(): void {
    this.events.length = 0;
  }

  /** Get the most recent N events */
  recent(n: number): DebugEvent[] {
    return this.events.slice(-n);
  }
}

/** Global singleton — imported everywhere */
export const debugLog = new DebugLog();
