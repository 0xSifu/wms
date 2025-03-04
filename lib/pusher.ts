import Pusher from 'pusher-js';

// Get Pusher key and cluster from environment variables
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '41a1ec9bc21c0ec74674';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';

/**
 * Pusher channel and event constants
 */
export const PUSHER_CONSTANTS = {
  CHANNEL: 'rfid-scan',
  EVENTS: {
    TAG_SCANNED: 'tag-scanned'
  }
} as const;

class PusherManager {
  private static instance: PusherManager;
  private pusherInstance: any;
  private channel: any | null = null;
  private eventHandlers: Map<string, Map<Function, Function>> = new Map();
  private lastEventData: { [key: string]: { timestamp: number; data: any; hash: string } } = {};
  private debounceTime = 2000; // 2 seconds to prevent rapid-fire events
  private isConnecting = false;

  private constructor() {
    // Disable all Pusher logging by default
    Pusher.logToConsole = false;

    this.pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      activityTimeout: 120000,     // 2 minutes
      pongTimeout: 30000           // 30 seconds
    });

    // Handle connection state changes
    this.pusherInstance.connection.bind('state_change', this.handleConnectionStateChange.bind(this));
  }

  private handleConnectionStateChange(states: { current: string; previous: string }): void {
    console.log(`Pusher connection: ${states.previous} -> ${states.current}`);
    
    if (states.current === 'connected') {
      this.isConnecting = false;
      this.subscribeToChannel();
    } else if (states.current === 'disconnected' || states.current === 'failed') {
      this.isConnecting = false;
      // Clean up on disconnection
      if (this.channel) {
        this.pusherInstance.unsubscribe(PUSHER_CONSTANTS.CHANNEL);
        this.channel = null;
      }
    } else if (states.current === 'connecting') {
      this.isConnecting = true;
    }
  }

  private subscribeToChannel(): void {
    if (!this.channel && !this.isConnecting) {
      this.channel = this.pusherInstance.subscribe(PUSHER_CONSTANTS.CHANNEL);
    }
  }

  private generateEventHash(data: any): string {
    return typeof data === 'object' ? JSON.stringify(data) : String(data);
  }

  private isDuplicateEvent(eventName: string, data: any): boolean {
    const lastEvent = this.lastEventData[eventName];
    if (!lastEvent) return false;

    const now = Date.now();
    if (now - lastEvent.timestamp < this.debounceTime) {
      // Compare event data using hash
      const currentHash = this.generateEventHash(data);
      return currentHash === lastEvent.hash;
    }
    return false;
  }

  public static getInstance(): PusherManager {
    if (!PusherManager.instance) {
      PusherManager.instance = new PusherManager();
    }
    return PusherManager.instance;
  }

  public bind(eventName: string, callback: Function): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Map());
    }

    const handlers = this.eventHandlers.get(eventName)!;
    if (!handlers.has(callback)) {
      // Create wrapped callback with deduplication
      const wrappedCallback = (data: any) => {
        if (this.isDuplicateEvent(eventName, data)) {
          return;
        }

        // Store this event with hash
        this.lastEventData[eventName] = {
          timestamp: Date.now(),
          data,
          hash: this.generateEventHash(data)
        };

        callback(data);
      };

      handlers.set(callback, wrappedCallback);

      // Bind the wrapped callback
      if (eventName === 'state_change') {
        this.pusherInstance.connection.bind(eventName, wrappedCallback);
      } else {
        this.subscribeToChannel();
        this.channel?.bind(eventName, wrappedCallback);
      }
    }
  }

  public unbind(eventName: string, callback: Function): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers?.has(callback)) {
      const wrappedCallback = handlers.get(callback);
      if (wrappedCallback) {
        if (eventName === 'state_change') {
          this.pusherInstance.connection.unbind(eventName, wrappedCallback);
        } else {
          this.channel?.unbind(eventName, wrappedCallback);
        }
        handlers.delete(callback);
      }
    }
  }

  public disconnect(): void {
    // First unbind all events
    this.eventHandlers.forEach((handlers, eventName) => {
      handlers.forEach((wrappedCallback, _) => {
        if (eventName === 'state_change') {
          this.pusherInstance.connection.unbind(eventName, wrappedCallback);
        } else {
          this.channel?.unbind(eventName, wrappedCallback);
        }
      });
    });

    // Clear all internal state
    this.eventHandlers.clear();
    this.lastEventData = {};
    this.isConnecting = false;

    // Unsubscribe and disconnect
    if (this.channel) {
      this.pusherInstance.unsubscribe(PUSHER_CONSTANTS.CHANNEL);
      this.channel = null;
    }
    
    // Force disconnect the Pusher instance
    this.pusherInstance.disconnect();
  }

  public connect(): void {
    if (!this.isConnecting) {
      this.isConnecting = true;
      this.pusherInstance.connect();
    }
  }

  public get connection(): any {
    return this.pusherInstance.connection;
  }
}

// Create and export the singleton instance
const pusherManager = PusherManager.getInstance();

// Export a clean interface
export const pusherClient = {
  bind: (eventName: string, callback: Function) => pusherManager.bind(eventName, callback),
  unbind: (eventName: string, callback: Function) => pusherManager.unbind(eventName, callback),
  connection: pusherManager.connection,
  connect: () => pusherManager.connect(),
  disconnect: () => pusherManager.disconnect()
}; 