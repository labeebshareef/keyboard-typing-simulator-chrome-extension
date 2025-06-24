/**
 * Character-by-character typing logic
 * Handles individual character typing with mistake simulation
 */

import { playKeySound } from './audio';
import { shouldMakeMistake, generateWrongCharacter } from './mistakes';
import { triggerInputEvents, triggerBackspaceEvents } from './events';
import { safeSetTimeout } from './control';

interface CharTypingState {
  isStopped: boolean;
  isPaused: boolean;
  mistakeCount: number;
  maxMistakes: number;
}

/**
 * Type a single character with mistake simulation
 * @param element - Target input element
 * @param text - Full text to type
 * @param index - Current character index
 * @param config - Typing configuration
 * @param state - Current typing state
 * @param getDelay - Function to get typing delay
 * @param onProgress - Progress callback
 * @param onComplete - Completion callback
 */
export function typeCharacter(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  index: number,
  config: { includeMistakes: boolean; soundEnabled: boolean },
  state: CharTypingState,
  getDelay: () => number,
  onProgress: (progress: number) => void,
  onComplete: () => void
): void {
  if (state.isStopped) return;
  
  if (state.isPaused) {
    safeSetTimeout(() => typeCharacter(element, text, index, config, state, getDelay, onProgress, onComplete), 100);
    return;
  }

  // Update progress
  onProgress((index / text.length) * 100);

  if (index >= text.length) {
    onProgress(100);
    onComplete();
    return;
  }

  const char = text[index];

  // Check for mistakes
  if (shouldMakeMistake(config.includeMistakes, state.mistakeCount, state.maxMistakes, element.value.length)) {
    state.mistakeCount++;
    
    const wrongChar = generateWrongCharacter();
    
    // Type wrong character
    element.value += wrongChar;
    triggerInputEvents(element, wrongChar);
    playKeySound(config.soundEnabled);

    // Backspace after a realistic delay
    safeSetTimeout(() => {
      if (!state.isStopped && element.value.length > 0) {
        simulateBackspace(element, config.soundEnabled);
        
        // Continue with correct character after another delay
        safeSetTimeout(() => typeCharacter(element, text, index, config, state, getDelay, onProgress, onComplete), getDelay());
      }
    }, getDelay() * 1.5);
    
    return;
  }

  // Type correct character
  element.value += char;
  triggerInputEvents(element, char);
  playKeySound(config.soundEnabled);

  safeSetTimeout(() => typeCharacter(element, text, index + 1, config, state, getDelay, onProgress, onComplete), getDelay());
}

/**
 * Simulate backspace operation
 * @param element - Target input element
 * @param soundEnabled - Whether to play sound
 */
function simulateBackspace(element: HTMLInputElement | HTMLTextAreaElement, soundEnabled: boolean): void {
  if (element.value.length === 0) return;
  
  element.value = element.value.slice(0, -1);
  triggerBackspaceEvents(element);
  playKeySound(soundEnabled);
}