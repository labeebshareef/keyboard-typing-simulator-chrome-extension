/**
 * Audio management for typing simulation
 * Handles keystroke sound generation and cleanup
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize audio context for typing sounds
 * @param enabled - Whether sound is enabled
 */
export function initAudioContext(enabled: boolean): void {
  if (!enabled || audioContext) return;

  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (error) {
    console.warn('Audio context not available:', error);
  }
}

/**
 * Play a keystroke sound
 * @param enabled - Whether sound is enabled
 */
export function playKeySound(enabled: boolean): void {
  if (!audioContext || !enabled) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Vary the frequency slightly for more realistic sound
    oscillator.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime);
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (error) {
    // Silently handle audio errors
  }
}

/**
 * Clean up audio context
 */
export function cleanupAudio(): void {
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
}
