import { SocketClientEvent, SocketServerEvent } from '../types/chat';

type ServerEventListener = (event: SocketServerEvent) => void;
type ConnectionStateListener = (connected: boolean) => void;

export interface SocketConnectCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onEvent?: (event: SocketServerEvent) => void;
}

class SocketService {
  private ws: WebSocket | null = null;
  private serverEventListeners = new Set<ServerEventListener>();
  private connectionListeners = new Set<ConnectionStateListener>();
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private pendingQueue: SocketClientEvent[] = [];
  private currentUserId: string | null = null;

  public isConnected = false;

  public connect(
    userProfile?: { id: string },
    callbacks?: SocketConnectCallbacks
  ): void {
    if (userProfile) {
      this.currentUserId = userProfile.id;
    }

    if (callbacks) {
      if (callbacks.onConnect) {
        this.connectionListeners.add((connected) => {
          if (connected && callbacks.onConnect) callbacks.onConnect();
        });
      }
      if (callbacks.onDisconnect) {
        this.connectionListeners.add((connected) => {
          if (!connected && callbacks.onDisconnect) callbacks.onDisconnect();
        });
      }
      if (callbacks.onEvent) {
        this.serverEventListeners.add(callbacks.onEvent);
      }
    }

    this.isExplicitlyClosed = false;
    this.initWebSocket();
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnected(false);
  }

  private initWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const url = `${protocol}//${host}/ws`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setConnected(true);

        // Flush queued messages if any
        while (this.pendingQueue.length > 0) {
          const evt = this.pendingQueue.shift();
          if (evt) {
            this.send(evt);
          }
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data: SocketServerEvent = JSON.parse(event.data);
          this.serverEventListeners.forEach((listener) => {
            try {
              listener(data);
            } catch (err) {
              console.error('[WS] Error in server event listener:', err);
            }
          });
        } catch (err) {
          console.error('[WS] Failed to parse message JSON:', err, event.data);
        }
      };

      this.ws.onclose = () => {
        this.setConnected(false);
        this.ws = null;

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.debug('[WS] Connection status notice:', err);
      };
    } catch (err) {
      console.error('[WS] Failed to initialize WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed || this.reconnectTimeout) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.initWebSocket();
    }, delay);
  }

  private setConnected(connected: boolean): void {
    this.isConnected = connected;
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  public send(event: SocketClientEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      // Enqueue to send immediately upon reconnection
      this.pendingQueue.push(event);
      if (!this.isConnected && !this.isExplicitlyClosed) {
        this.initWebSocket();
      }
    }
  }

  public onServerEvent(listener: ServerEventListener): () => void {
    this.serverEventListeners.add(listener);
    return () => {
      this.serverEventListeners.delete(listener);
    };
  }

  public onConnectionState(listener: ConnectionStateListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.isConnected);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }
}

export const socketService = new SocketService();
