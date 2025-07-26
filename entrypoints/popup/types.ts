export type TypingStyle = 'normal' | 'random' | 'word-by-word';

export interface TypingConfig {
  delay: number;
  includeMistakes: boolean;
  soundEnabled: boolean;
  typingStyle: TypingStyle;
}

export interface TypingState {
  isTyping: boolean;
  isPaused: boolean;
  progress: number;
  currentIndex: number;
}

// Advanced Typing Types
export interface DetectedField {
  id: string;
  priority: number;
  label: string;
  text: string;
  enabled: boolean;
  selector: string;
  elementType: 'input' | 'textarea' | 'contenteditable';
  placeholder?: string;
}

export interface AdvancedTypingConfig {
  initialDelay: number; // 0-10 seconds
  hideExtension: boolean;
  interFieldDelay: number; // 0-5 seconds
}

export interface AdvancedTypingState {
  isScanning: boolean;
  detectedFields: DetectedField[];
  isTyping: boolean;
  currentFieldIndex: number;
  progress: number;
}

// Remote Typing Types
export interface RemoteSession {
  sessionCode: string;
  isActive: boolean;
  lastSeen: number;
  qrCodeUrl: string;
  expiresAt: number;
}

export interface TypingInstruction {
  text: string;
  mode: 'basic' | 'advanced' | 'field-specific';
  targetField?: string;
  config: TypingConfig & AdvancedTypingConfig;
}
