export type TypingStyle = 'normal' | 'random' | 'word-by-word';
export type ThemePreference = 'light' | 'dark' | 'system';

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
  scanToken: string;
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

export type TypingSessionPhase =
  | 'idle'
  | 'validating'
  | 'delaying'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'completed'
  | 'failed';

export interface TypingSessionStatus {
  sessionId: string | null;
  mode: 'basic' | 'advanced' | null;
  phase: TypingSessionPhase;
  progress: number;
  currentFieldIndex: number;
  totalFields: number;
  completedFields: number;
  failedFields: number;
  message: string;
}

export interface TypingSessionStartResult {
  ok: boolean;
  status: TypingSessionStatus;
  errorCode?: string;
}
