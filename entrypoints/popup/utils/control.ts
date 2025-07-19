/**
 * Typing session control utilities
 * Handles pause/resume/stop state and timeout management
 */

// Global timeout tracking for cleanup
let timeoutIds: number[] = [];

/**
 * Safe setTimeout wrapper that tracks timeout IDs for cleanup
 * @param callback - Function to execute
 * @param delay - Delay in milliseconds
 */
export function safeSetTimeout(callback: () => void, delay: number): void {
  const timeoutId = window.setTimeout(
    () => {
      // Remove this timeout ID from tracking array
      const index = timeoutIds.indexOf(timeoutId);
      if (index > -1) {
        timeoutIds.splice(index, 1);
      }
      callback();
    },
    Math.max(delay, 10)
  ); // Enforce minimum delay

  timeoutIds.push(timeoutId);
}

/**
 * Clear all tracked timeouts
 */
export function clearAllTimeouts(): void {
  timeoutIds.forEach((id) => clearTimeout(id));
  timeoutIds = [];
}

/**
 * Get typing delay based on style and base delay
 * @param baseDelay - Base delay in milliseconds
 * @param typingStyle - Style of typing
 * @returns Calculated delay
 */
export function getTypingDelay(baseDelay: number, typingStyle: string): number {
  const safeDelay = Math.max(baseDelay, 10); // Enforce minimum 10ms

  switch (typingStyle) {
    case 'random':
      return Math.random() * (safeDelay * 2) + safeDelay * 0.5;
    case 'word-by-word':
      return safeDelay;
    case 'normal':
    default:
      return safeDelay;
  }
}

/**
 * Validate and prepare input element for typing
 * @param element - Potential input element
 * @returns Validated element or null if invalid
 */
export function validateInputElement(
  element: Element | null
): HTMLInputElement | HTMLTextAreaElement | null {
  if (!element || !['INPUT', 'TEXTAREA'].includes(element.tagName)) {
    return null;
  }

  const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

  // Check if element is editable
  if (inputElement.hasAttribute('readonly') || inputElement.hasAttribute('disabled')) {
    return null;
  }

  return inputElement;
}
