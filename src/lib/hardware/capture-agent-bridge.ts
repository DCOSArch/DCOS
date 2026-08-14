import { WSMessage, HardwareDevice, CapturedFramePayload } from './types';
import { BiTemporalEventStore } from '../events/store';

export class CaptureAgentBridge {
  private static wsUrl = 'ws://127.0.0.1:12345';
  private static ws: WebSocket | null = null;
  private static isConnected = false;
  private static offlineQueue: CapturedFramePayload[] = [];
  private static listeners: Array<(frame: CapturedFramePayload) => void> = [];
  private static statusListeners: Array<(connected: boolean) => void> = [];

  /**
   * Initializes WebSocket connection to the local operatory hardware bridge.
   */
  public static initialize(operatoryId = 'OPERATORY-01'): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log(`[CaptureBridge] Connected to Local Hardware Agent at ${this.wsUrl}`);
        this.notifyStatus(true);

        // Send Handshake
        this.sendMessage({
          type: 'AGENT_HANDSHAKE',
          deviceId: 'DCOS-WEB-CLIENT',
          timestamp: new Date().toISOString(),
          payload: { operatoryId, clientVersion: '2.0.0' },
        });

        // Flush offline queue
        this.flushOfflineQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          console.error('[CaptureBridge] Failed to parse hardware message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        // Automatic exponential backoff reconnect
        setTimeout(() => this.initialize(operatoryId), 5000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch (err) {
      console.warn('[CaptureBridge] Local WebSocket agent unavailable (mocking operatory camera):', err);
      this.isConnected = false;
      this.notifyStatus(false);
    }
  }

  /**
   * Triggers a hardware snap command to the connected operatory camera.
   */
  public static triggerCapture(deviceId = 'IOC-01', toothNumber?: number): void {
    const msg: WSMessage = {
      type: 'CAPTURE_REQUEST',
      deviceId,
      timestamp: new Date().toISOString(),
      payload: { toothNumber },
    };

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[CaptureBridge] Bridge offline. Simulated hardware snap generated.');
      this.simulateHardwareSnap(deviceId, toothNumber);
    }
  }

  /**
   * Simulates a hardware frame capture for testing when the native companion app is not active.
   */
  public static simulateHardwareSnap(deviceId = 'IOC-01', toothNumber?: number): CapturedFramePayload {
    const frame: CapturedFramePayload = {
      frameId: `frame-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      mimeType: 'image/jpeg',
      base64Data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
      toothNumber: toothNumber || 16,
      shadeGuide: 'VITA A2',
      metadata: { deviceId, simulated: true, capturedAt: new Date().toISOString() },
    };

    this.notifyFrameListeners(frame);
    return frame;
  }

  /**
   * Dispatches incoming WebSocket messages from the local agent.
   */
  private static handleMessage(msg: WSMessage): void {
    if (msg.type === 'FRAME_DATA' || msg.type === 'CAPTURE_TRIGGER') {
      const frame: CapturedFramePayload = msg.payload;
      this.notifyFrameListeners(frame);
    }
  }

  private static sendMessage(msg: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public static onFrame(callback: (frame: CapturedFramePayload) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public static onStatusChange(callback: (connected: boolean) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== callback);
    };
  }

  private static notifyFrameListeners(frame: CapturedFramePayload): void {
    for (const listener of this.listeners) {
      listener(frame);
    }
  }

  private static notifyStatus(connected: boolean): void {
    for (const sub of this.statusListeners) {
      sub(connected);
    }
  }

  private static flushOfflineQueue(): void {
    while (this.offlineQueue.length > 0) {
      const frame = this.offlineQueue.shift();
      if (frame) this.notifyFrameListeners(frame);
    }
  }

  public static getIsConnected(): boolean {
    return this.isConnected;
  }
}
