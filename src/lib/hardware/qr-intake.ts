import { MobileIntakeToken } from './types';

/**
 * Chairside Smartphone QR Intake Manager
 * Generates transient tokens for chairside mobile photo capture and manages real-time broadcast.
 */
export class QRIntakeManager {
  private static tokenStore: Record<string, MobileIntakeToken> = {};

  /**
   * Generates a 15-minute transient mobile intake session token.
   */
  public static generateSessionToken(
    patientId: string,
    encounterId: string,
    dentistId: string
  ): MobileIntakeToken {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const token = `mob-${Date.now()}-${randomHex}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    const session: MobileIntakeToken = {
      token,
      patientId,
      encounterId,
      dentistId,
      createdAt: new Date().toISOString(),
      expiresAt,
      isUsed: false,
    };

    this.tokenStore[token] = session;
    return session;
  }

  /**
   * Validates a mobile intake token.
   */
  public static validateToken(token: string): {
    isValid: boolean;
    session?: MobileIntakeToken;
    reason?: string;
  } {
    const session = this.tokenStore[token];
    if (!session) {
      return { isValid: false, reason: 'Invalid or expired intake token.' };
    }

    if (new Date().getTime() > new Date(session.expiresAt).getTime()) {
      return { isValid: false, reason: 'Session token has expired (15m validity limit).' };
    }

    return { isValid: true, session };
  }

  /**
   * Marks a token session as completed.
   */
  public static markTokenUsed(token: string): void {
    if (this.tokenStore[token]) {
      this.tokenStore[token].isUsed = true;
    }
  }

  /**
   * Generates full mobile upload URL for QR encoding.
   */
  public static getMobileUploadUrl(token: string, baseUrl = 'https://dcos.in'): string {
    return `${baseUrl}/upload/${token}`;
  }
}
