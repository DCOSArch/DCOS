/**
 * ABDM Milestone 1 (M1) — ABHA Identity & Authentication Service
 * Ayushman Bharat Digital Mission (ABDM) Integration Layer
 */

export interface ABHAProfile {
  abhaNumber: string; // 14-digit ABHA Number: XX-XXXX-XXXX-XXXX
  abhaAddress: string; // user@abdm
  fullName: string;
  gender: 'M' | 'F' | 'O';
  dateOfBirth: string;
  mobile: string;
  verified: boolean;
  kycStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
}

export class ABHAService {
  /**
   * Validates standard 14-digit Indian ABHA ID formatting.
   */
  public static isValidABHANumber(abhaNumber: string): boolean {
    const cleaned = abhaNumber.replace(/-/g, '').trim();
    return /^\d{14}$/.test(cleaned);
  }

  /**
   * Validates ABHA Address formatting (e.g. maneesh.vishnoi@abdm).
   */
  public static isValidABHAAddress(address: string): boolean {
    return /^[a-zA-Z0-9._]+@(abdm|sbx)$/.test(address);
  }

  /**
   * Simulates/Executes ABDM Gateway M1 OTP verification flow.
   */
  public static async verifyABHA(abhaNumber: string): Promise<ABHAProfile> {
    if (!this.isValidABHANumber(abhaNumber)) {
      throw new Error(`Invalid ABHA Number format: ${abhaNumber}. Must be 14 digits.`);
    }

    // Mock verification resolution
    return {
      abhaNumber: abhaNumber.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4'),
      abhaAddress: `${abhaNumber.slice(-6)}@abdm`,
      fullName: 'ABHA Verified Patient',
      gender: 'M',
      dateOfBirth: '1990-01-01',
      mobile: '+91 98765 43210',
      verified: true,
      kycStatus: 'VERIFIED',
    };
  }
}
