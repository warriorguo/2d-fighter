/**
 * WebSocket client for co-op networking.
 */

export type MessageType =
  | 'create_room'
  | 'join_room'
  | 'room_created'
  | 'player_joined'
  | 'game_start'
  | 'tick_input'
  | 'tick_inputs'
  | 'error';

export interface NetMessage {
  type: MessageType;
  [key: string]: unknown;
}

export class NetworkClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;

  // Callbacks
  onRoomCreated: ((code: string) => void) | null = null;
  onPlayerJoined: ((count: number) => void) | null = null;
  onGameStart: ((seed: number, playerId: number, levelIndex: number) => void) | null = null;
  onTickInputs: ((tick: number, inputs: number[]) => void) | null = null;
  onError: ((msg: string) => void) | null = null;

  constructor(serverUrl?: string) {
    if (serverUrl) {
      this.serverUrl = serverUrl;
    } else {
      // Dev mode (Vite port 3000): connect directly to WS server on 8080
      // Production (nginx): connect via /ws proxy on same host/port
      const loc = window.location;
      const isDev = loc.port === '3000';
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      this.serverUrl = isDev
        ? `ws://${loc.hostname}:8080`
        : `${proto}//${loc.host}/ws`;
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        this.ws.onopen = () => resolve();
        this.ws.onerror = () => reject(new Error('Connection failed'));
        this.ws.onclose = () => { this.ws = null; };
        this.ws.onmessage = (event) => {
          const msg = JSON.parse(event.data) as NetMessage;
          this.handleMessage(msg);
        };
      } catch {
        reject(new Error('Connection failed'));
      }
    });
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  private handleMessage(msg: NetMessage): void {
    switch (msg.type) {
      case 'room_created':
        this.onRoomCreated?.(msg.code as string);
        break;
      case 'player_joined':
        this.onPlayerJoined?.(msg.count as number);
        break;
      case 'game_start':
        this.onGameStart?.(msg.seed as number, msg.playerId as number, (msg.levelIndex as number) ?? 0);
        break;
      case 'tick_inputs':
        this.onTickInputs?.(msg.tick as number, msg.inputs as number[]);
        break;
      case 'error':
        this.onError?.(msg.message as string);
        break;
    }
  }

  private send(msg: NetMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  createRoom(levelIndex: number = 0): void {
    this.send({ type: 'create_room', levelIndex });
  }

  joinRoom(code: string): void {
    this.send({ type: 'join_room', code });
  }

  startGame(seed: number): void {
    this.send({ type: 'game_start', seed });
  }

  sendInput(tick: number, inputBits: number): void {
    this.send({ type: 'tick_input', tick, input: inputBits });
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
