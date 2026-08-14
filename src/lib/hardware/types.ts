/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 3 Hardware Capture Bridge Types
 * Local Operatory Device Protocol (ws://127.0.0.1:12345) & Mobile QR Ingestion
 */

export interface HardwareDevice {
  deviceId: string; // e.g. "IOC-01", "PEDAL-01", "SCANNER-01"
  deviceType: 'INTRAORAL_CAMERA' | 'FOOT_PEDAL' | 'DESKTOP_SCANNER' | 'MOBILE_CAPTURE';
  operatoryId: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  lastSeenAt: string;
}

export type WSMessageType =
  | 'AGENT_HANDSHAKE'
  | 'CAPTURE_REQUEST'
  | 'CAPTURE_TRIGGER'
  | 'CAMERA_STATUS'
  | 'FRAME_DATA'
  | 'CAPTURE_SUCCESS'
  | 'ERROR';

export interface WSMessage<T = any> {
  type: WSMessageType;
  deviceId: string;
  timestamp: string;
  payload: T;
}

export interface CapturedFramePayload {
  frameId: string;
  mimeType: string;
  base64Data: string;
  toothNumber?: number;
  shadeGuide?: string;
  metadata?: Record<string, any>;
}

export interface MobileIntakeToken {
  token: string;
  patientId: string;
  encounterId: string;
  dentistId: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
}
