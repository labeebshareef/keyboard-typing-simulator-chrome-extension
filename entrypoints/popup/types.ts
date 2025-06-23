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