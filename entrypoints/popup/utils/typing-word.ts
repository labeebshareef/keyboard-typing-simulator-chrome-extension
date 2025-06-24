/**
 * Word-by-word typing logic
 * Handles typing complete words at once
 */

import { playKeySound } from './audio';
import { triggerInputEvents } from './events';
import { safeSetTimeout } from './control';

interface WordTypingState {
  isStopped: boolean;
  isPaused: boolean;
}

/**
 * Type words one by one with delays between them
 * @param element - Target input element
 * @param words - Array of words to type
 * @param wordIndex - Current word index
 * @param config - Typing configuration
 * @param state - Current typing state
 * @param getDelay - Function to get typing delay
 * @param onProgress - Progress callback
 * @param onComplete - Completion callback
 */
export function typeWordByWord(
  element: HTMLInputElement | HTMLTextAreaElement,
  words: string[],
  wordIndex: number,
  config: { soundEnabled: boolean },
  state: WordTypingState,
  getDelay: () => number,
  onProgress: (progress: number) => void,
  onComplete: () => void
): void {
  if (state.isStopped) return;
  
  if (state.isPaused) {
    safeSetTimeout(() => typeWordByWord(element, words, wordIndex, config, state, getDelay, onProgress, onComplete), 100);
    return;
  }

  // Update progress
  onProgress((wordIndex / words.length) * 100);

  if (wordIndex >= words.length) {
    onProgress(100);
    onComplete();
    return;
  }

  const word = words[wordIndex];
  const isLastWord = wordIndex === words.length - 1;
  const textToAdd = isLastWord ? word : word + ' ';

  element.value += textToAdd;
  triggerInputEvents(element, textToAdd);
  playKeySound(config.soundEnabled);

  safeSetTimeout(() => typeWordByWord(element, words, wordIndex + 1, config, state, getDelay, onProgress, onComplete), getDelay() * 3);
}