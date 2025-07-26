import type {
  AdvancedTypingConfig,
  DetectedField,
  TypingConfig,
  TypingInstruction,
} from '../types';

export class TypingEngine {
  static async executeBasicTyping(
    text: string,
    config: TypingConfig & AdvancedTypingConfig
  ): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('Unable to access the current tab');
    }

    if (
      tab.url?.startsWith('chrome://') ||
      tab.url?.startsWith('chrome-extension://') ||
      tab.url?.startsWith('moz-extension://')
    ) {
      throw new Error('Cannot type on this page. Please navigate to a regular website.');
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: executeBasicTypingScript,
      args: [{ text, config }],
    });
  }

  static async executeAdvancedTyping(
    text: string,
    config: TypingConfig & AdvancedTypingConfig
  ): Promise<void> {
    // First scan for fields, then type into the first available field
    const fields = await this.scanCurrentPage();

    if (fields.length === 0) {
      // Fallback to basic typing
      return this.executeBasicTyping(text, config);
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: executeAdvancedTyping,
      args: [
        {
          fields: [
            {
              ...fields[0],
              text,
              enabled: true,
            },
          ],
          typingConfig: config,
          advancedConfig: config,
        },
      ],
    });
  }

  static async executeFieldSpecificTyping(
    targetField: string,
    text: string,
    config: TypingConfig & AdvancedTypingConfig
  ): Promise<void> {
    const fields = await this.scanCurrentPage();
    const field = fields.find((f) => f.id === targetField || f.selector === targetField);

    if (!field) {
      throw new Error(`Target field not found: ${targetField}`);
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: executeAdvancedTyping,
      args: [
        {
          fields: [
            {
              ...field,
              text,
              enabled: true,
            },
          ],
          typingConfig: config,
          advancedConfig: config,
        },
      ],
    });
  }

  static async scanCurrentPage(): Promise<DetectedField[]> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) return [];

    if (
      tab.url?.startsWith('chrome://') ||
      tab.url?.startsWith('chrome-extension://') ||
      tab.url?.startsWith('moz-extension://')
    ) {
      return [];
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scanPageForFields,
    });

    return results?.[0]?.result || [];
  }

  static async executeTypingInstruction(instruction: TypingInstruction): Promise<void> {
    switch (instruction.mode) {
      case 'basic':
        await this.executeBasicTyping(instruction.text, instruction.config);
        break;
      case 'advanced':
        await this.executeAdvancedTyping(instruction.text, instruction.config);
        break;
      case 'field-specific':
        if (!instruction.targetField) {
          throw new Error('Target field is required for field-specific typing');
        }
        await this.executeFieldSpecificTyping(
          instruction.targetField,
          instruction.text,
          instruction.config
        );
        break;
      default:
        throw new Error(`Unknown typing mode: ${instruction.mode}`);
    }
  }
}

// Content script for basic typing
function executeBasicTypingScript({
  text,
  config,
}: {
  text: string;
  config: TypingConfig & AdvancedTypingConfig;
}): void {
  // Find the currently focused element or the first input field
  let targetElement = document.activeElement as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLElement;

  if (
    !targetElement ||
    (targetElement.tagName !== 'INPUT' &&
      targetElement.tagName !== 'TEXTAREA' &&
      !targetElement.isContentEditable)
  ) {
    // Find first available input field
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"]), textarea, [contenteditable="true"]'
    );
    targetElement = inputs[0] as HTMLInputElement | HTMLTextAreaElement | HTMLElement;
  }

  if (!targetElement) {
    alert('No input field found on this page');
    return;
  }

  // Focus the element
  targetElement.focus();

  // Use the extracted typing logic
  simulateTyping(targetElement, text, config);
}

// Shared typing simulation function
function simulateTyping(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLElement,
  text: string,
  config: TypingConfig & AdvancedTypingConfig
): void {
  let currentIndex = 0;
  let timeoutId: number;

  // Clear existing content
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    element.textContent = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const typeChar = () => {
    try {
      if (currentIndex >= text.length) {
        // Typing completed
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }

      const char = text[currentIndex];

      // Trigger keyboard events for better compatibility
      const keydownEvent = new KeyboardEvent('keydown', {
        key: char,
        code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(keydownEvent);

      const keypressEvent = new KeyboardEvent('keypress', {
        key: char,
        charCode: char.charCodeAt(0),
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(keypressEvent);

      // Update the element content
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value += char;
        element.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: char,
            inputType: 'insertText',
          })
        );
      } else if (element.isContentEditable) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textNode = document.createTextNode(char);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          element.textContent += char;
        }
        element.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: char,
            inputType: 'insertText',
          })
        );
      }

      const keyupEvent = new KeyboardEvent('keyup', {
        key: char,
        code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(keyupEvent);

      currentIndex++;

      // Play typing sound if enabled
      if (config.soundEnabled) {
        // Create a subtle click sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }

      // Calculate delay based on typing style
      const delay =
        config.typingStyle === 'random'
          ? Math.random() * (config.delay * 2) + config.delay * 0.5
          : config.delay;

      timeoutId = window.setTimeout(typeChar, Math.max(delay, 10));
    } catch (error) {
      console.error('Error typing character:', error);
    }
  };

  // Wait for initial delay if specified
  const initialDelay = config.initialDelay * 1000 || 0;
  setTimeout(() => {
    typeChar();
  }, initialDelay);
}

// Content script function to scan for input fields (extracted from AdvancedTyping.tsx)
function scanPageForFields(): DetectedField[] {
  const fields: DetectedField[] = [];
  let idCounter = 1;

  // Find all input, textarea, and contenteditable elements
  const selectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="search"]',
    'input[type="url"]',
    'input[type="tel"]',
    'input:not([type])',
    'textarea',
    '[contenteditable="true"]',
    '[contenteditable=""]',
  ];

  const elements = document.querySelectorAll(selectors.join(', '));

  elements.forEach((element) => {
    try {
      // Skip hidden or disabled elements
      if (element instanceof HTMLElement) {
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) {
          return;
        }
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        if (element.disabled || element.readOnly) {
          return;
        }
      }

      // Generate a unique selector for this element
      const generateSelector = (el: Element): string => {
        if (el.id && el.id.trim()) {
          return `#${CSS.escape(el.id)}`;
        }

        if ((el as HTMLInputElement).name) {
          return `${el.tagName.toLowerCase()}[name="${CSS.escape((el as HTMLInputElement).name)}"]`;
        }

        if (el.className && el.className.trim()) {
          const classes = el.className
            .trim()
            .split(/\s+/)
            .map((cls) => CSS.escape(cls))
            .join('.');
          return `${el.tagName.toLowerCase()}.${classes}`;
        }

        const parent = el.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            (child) => child.tagName === el.tagName
          );
          const index = siblings.indexOf(el);
          return `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
        }

        return el.tagName.toLowerCase();
      };

      // Get field label
      const getFieldLabel = (el: Element): string => {
        if (el.id && el.id.trim()) {
          const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          if (label?.textContent && label.textContent.trim()) {
            return label.textContent.trim();
          }
        }

        const parentLabel = el.closest('label');
        if (parentLabel?.textContent) {
          const labelText = parentLabel.textContent.replace(el.textContent || '', '').trim();
          if (labelText) return labelText;
        }

        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        if (ariaLabelledBy) {
          const labelElement = document.getElementById(ariaLabelledBy);
          if (labelElement?.textContent && labelElement.textContent.trim()) {
            return labelElement.textContent.trim();
          }
        }

        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          if (el.placeholder && el.placeholder.trim()) return el.placeholder.trim();
        }

        let prevElement = el.previousElementSibling;
        while (prevElement) {
          if (prevElement.textContent && prevElement.textContent.trim()) {
            const text = prevElement.textContent.trim();
            if (text.length < 50) {
              return text;
            }
          }
          prevElement = prevElement.previousElementSibling;
        }

        const title = el.getAttribute('title');
        if (title && title.trim()) return title.trim();

        if ((el as HTMLInputElement).name) {
          return (el as HTMLInputElement).name;
        }

        return `Field ${idCounter}`;
      };

      const elementType: DetectedField['elementType'] =
        element.tagName.toLowerCase() === 'textarea'
          ? 'textarea'
          : element.hasAttribute('contenteditable') &&
              element.getAttribute('contenteditable') !== 'false'
            ? 'contenteditable'
            : 'input';

      const field: DetectedField = {
        id: `field_${idCounter++}`,
        priority: fields.length + 1,
        label: getFieldLabel(element),
        text: '',
        enabled: true,
        selector: generateSelector(element),
        elementType,
        placeholder:
          element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
            ? element.placeholder
            : undefined,
      };

      fields.push(field);
    } catch (error) {
      console.warn('Error processing element:', element, error);
    }
  });

  return fields;
}

// Content script function to execute advanced typing (extracted from AdvancedTyping.tsx)
async function executeAdvancedTyping({
  fields,
  typingConfig,
  advancedConfig,
}: {
  fields: DetectedField[];
  typingConfig: TypingConfig;
  advancedConfig: AdvancedTypingConfig;
}) {
  try {
    if (advancedConfig.initialDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, advancedConfig.initialDelay * 1000));
    }

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      try {
        let element: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null = null;

        try {
          element = document.querySelector(field.selector) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLElement;
        } catch (selectorError) {
          console.warn(`Invalid selector: ${field.selector}`, selectorError);
        }

        if (!element && field.selector.startsWith('#')) {
          const id = field.selector.substring(1);
          element = document.getElementById(id) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLElement;
        }

        if (!element) {
          console.warn(`Element not found for field: ${field.label}`);
          continue;
        }

        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
          console.warn(`Element is not visible: ${field.label}`);
          continue;
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise((resolve) => setTimeout(resolve, 200));

        element.focus();
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Use the shared typing function
        simulateTyping(element, field.text, { ...typingConfig, ...advancedConfig });

        if (i < fields.length - 1 && advancedConfig.interFieldDelay > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, advancedConfig.interFieldDelay * 1000)
          );
        }
      } catch (error) {
        console.error(`Error typing into field ${field.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in executeAdvancedTyping:', error);
  }
}
