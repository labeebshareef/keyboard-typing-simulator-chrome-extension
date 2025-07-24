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
  // Enhanced metadata for AI context
  name?: string;
  type?: string;
  formContext?: string;
  fieldContext?: string;
}

export interface AdvancedTypingConfig {
  initialDelay: number; // 0-10 seconds
  hideExtension: boolean;
  interFieldDelay: number; // 0-5 seconds
  // AI auto-fill settings
  aiEnabled: boolean;
  aiTemperature: number; // 0.1-1.0 for creativity control
}

export interface AdvancedTypingState {
  isScanning: boolean;
  detectedFields: DetectedField[];
  isTyping: boolean;
  currentFieldIndex: number;
  progress: number;
}
