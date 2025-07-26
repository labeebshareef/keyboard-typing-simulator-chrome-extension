import { type DatabaseReference, off, onValue, ref, serverTimestamp, set } from 'firebase/database';
import QRCode from 'qrcode';
import { database } from '../firebase/config';
import type { TypingInstruction } from '../types';
import { TypingEngine } from '../utils/typingEngine';

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
    this.sessionCode = sessionCode;

    // Initialize Firebase session
    await this.tryFirebaseConnection(sessionCode);

    // Get production web app URL from environment variables
    const webAppUrl = import.meta.env.VITE_REMOTE_TYPING_WEB_APP_URL || 
                     process.env.REMOTE_TYPING_WEB_APP_URL || 
                     'https://remote-typing.app'; // Default production URL
    const qrCodeUrl = await this.generateQRCode(`${webAppUrl}/remote/${sessionCode}`);

    return { sessionCode, qrCodeUrl };
  }

  private async tryFirebaseConnection(sessionCode: string): Promise<boolean> {
    try {
      const sessionRef = ref(database, `sessions/${sessionCode}`);
      const sessionData = {
        active: true,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        typingData: null,
      };

      await set(sessionRef, sessionData);
      this.startHeartbeat();
      this.listenForTypingInstructions();
      return true;
    } catch (error) {
      throw error;
    }
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 128,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code for remote session');
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

    this.listener = onValue(
      this.typingRef,
      (snapshot) => {
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
      },
      (error) => {
        console.error('Firebase listener error:', error);
      }
    );
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
