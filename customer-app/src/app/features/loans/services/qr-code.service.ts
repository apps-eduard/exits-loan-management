import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

export interface CustomerQRData {
  customerId: string;
  customerName: string;
  loanId?: string;
  loanNumber?: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  constructor() {}

  /**
   * Generate QR code data for customer payment collection
   */
  generateCustomerQRData(customerId: string, customerName: string, loanId?: string, loanNumber?: string): string {
    const qrData: CustomerQRData = {
      customerId,
      customerName,
      loanId,
      loanNumber,
      timestamp: Date.now()
    };
    return JSON.stringify(qrData);
  }

  /**
   * Generate QR code as Data URL for display
   */
  async generateQRCode(data: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Validate QR data (check if not expired - 5 minutes)
   */
  validateQRData(qrDataString: string): CustomerQRData | null {
    try {
      const qrData: CustomerQRData = JSON.parse(qrDataString);
      const currentTime = Date.now();
      const qrAge = currentTime - qrData.timestamp;
      const fiveMinutes = 5 * 60 * 1000;

      if (qrAge > fiveMinutes) {
        console.warn('QR code expired');
        return null;
      }

      return qrData;
    } catch (error) {
      console.error('Invalid QR data:', error);
      return null;
    }
  }

  /**
   * Parse QR data from scanned string
   */
  parseQRData(qrDataString: string): CustomerQRData | null {
    try {
      return JSON.parse(qrDataString);
    } catch (error) {
      console.error('Error parsing QR data:', error);
      return null;
    }
  }
}
