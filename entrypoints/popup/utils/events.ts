/**
 * DOM event dispatching utilities for typing simulation
 * Handles keyboard and input events to ensure compatibility
 */

/**
 * Dispatch keyboard and input events for a character
 * @param element - Target input element
 * @param char - Character being typed
 */
export function triggerInputEvents(
  element: HTMLInputElement | HTMLTextAreaElement,
  char: string
): void {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: char,
      bubbles: true,
      cancelable: true,
    })
  );

  element.dispatchEvent(
    new KeyboardEvent('keypress', {
      key: char,
      bubbles: true,
      cancelable: true,
    })
  );

  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: char,
      inputType: 'insertText',
    })
  );

  element.dispatchEvent(
    new KeyboardEvent('keyup', {
      key: char,
      bubbles: true,
      cancelable: true,
    })
  );
}

/**
 * Dispatch backspace events
 * @param element - Target input element
 */
export function triggerBackspaceEvents(element: HTMLInputElement | HTMLTextAreaElement): void {
  element.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Backspace',
      code: 'Backspace',
      bubbles: true,
      cancelable: true,
    })
  );

  element.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'deleteContentBackward',
    })
  );

  element.dispatchEvent(
    new KeyboardEvent('keyup', {
      key: 'Backspace',
      code: 'Backspace',
      bubbles: true,
      cancelable: true,
    })
  );
}

/**
 * Dispatch change event when typing is complete
 * @param element - Target input element
 */
export function triggerChangeEvent(element: HTMLInputElement | HTMLTextAreaElement): void {
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
