import { ref, set, onValue, off, serverTimestamp, type DatabaseReference } from 'firebase/database';
import QRCode from 'qrcode';
import { database } from '../firebase/config';
import { TypingEngine } from '../utils/typingEngine';
import type { TypingInstruction } from '../types';

export class SessionService {
  private sessionCode: string | null = null;
  private listener: (() => void) | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private typingRef: DatabaseReference | null = null;

  generateSessionCode(): string {
    // Generate 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createSession(): Promise<{ sessionCode: string; qrCodeUrl: string }> {
    const sessionCode = this.generateSessionCode();
    const sessionRef = ref(database, `sessions/${sessionCode}`);

    const sessionData = {
      active: true,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
      typingData: null
    };

    try {
      await set(sessionRef, sessionData);

      this.sessionCode = sessionCode;
      this.startHeartbeat();
      this.listenForTypingInstructions();

      // For demo purposes, use a placeholder web app URL
      // In production, this would be your actual web app URL
      const webAppUrl = 'https://your-remote-typing-app.com';
      const qrCodeUrl = await this.generateQRCode(`${webAppUrl}/remote/${sessionCode}`);

      return { sessionCode, qrCodeUrl };
    } catch (error) {
      console.error('Failed to create Firebase session:', error);
      // For demo purposes, still return the session info but log the error
      const qrCodeUrl = await this.generateQRCode(`demo://remote/${sessionCode}`);
      return { sessionCode, qrCodeUrl };
    }
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 128,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      // Return a placeholder data URL for a simple QR-like pattern
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxNiIgeT0iMTYiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjQiIHk9IjI0IiB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IndoaXRlIi8+Cjx0ZXh0IHg9IjY0IiB5PSI3MiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iYmxhY2siIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiPlFSPC90ZXh0Pgo8L3N2Zz4K';
    }
  }

  private startHeartbeat(): void {
    if (!this.sessionCode) return;

    this.heartbeatInterval = setInterval(async () => {
      if (!this.sessionCode) return;

      try {
        const sessionRef = ref(database, `sessions/${this.sessionCode}/lastSeen`);
        await set(sessionRef, serverTimestamp());
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    }, 15000); // Every 15 seconds
  }

  private listenForTypingInstructions(): void {
    if (!this.sessionCode) return;

    this.typingRef = ref(database, `sessions/${this.sessionCode}/typingData`);

    this.listener = onValue(this.typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.handleTypingInstruction(data);
        // Clear the instruction after processing
        try {
          set(this.typingRef!, null);
        } catch (error) {
          console.error('Failed to clear typing instruction:', error);
        }
      }
    }, (error) => {
      console.error('Firebase listener error:', error);
    });
  }

  private async handleTypingInstruction(data: TypingInstruction): Promise<void> {
    try {
      console.log('Processing typing instruction:', data);
      await TypingEngine.executeTypingInstruction(data);
    } catch (error) {
      console.error('Error executing typing instruction:', error);
    }
  }

  async endSession(): Promise<void> {
    if (!this.sessionCode) return;

    try {
      // Clear heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Remove listener
      if (this.listener && this.typingRef) {
        off(this.typingRef);
        this.listener = null;
        this.typingRef = null;
      }

      // Mark session as inactive
      const sessionRef = ref(database, `sessions/${this.sessionCode}/active`);
      await set(sessionRef, false);
    } catch (error) {
      console.error('Failed to end Firebase session:', error);
    } finally {
      this.sessionCode = null;
    }
  }

  isSessionActive(): boolean {
    return this.sessionCode !== null;
  }

  getCurrentSessionCode(): string | null {
    return this.sessionCode;
  }
}