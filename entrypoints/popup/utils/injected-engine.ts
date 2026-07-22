import type {
  AdvancedTypingConfig,
  DetectedField,
  TypingConfig,
  TypingSessionStartResult,
  TypingSessionStatus,
} from '../types';

export interface PageTypingRequest {
  mode: 'basic' | 'advanced';
  text?: string;
  fields?: DetectedField[];
  typingConfig: TypingConfig;
  advancedConfig?: AdvancedTypingConfig;
}

export interface ScanResult {
  fields: DetectedField[];
  scanToken: string;
}

export function getPageTypingStatus(): TypingSessionStatus {
  type SessionWindow = Window & {
    __ktsSession?: { status: TypingSessionStatus };
  };

  const session = (window as SessionWindow).__ktsSession;
  return (
    session?.status ?? {
      sessionId: null,
      mode: null,
      phase: 'idle',
      progress: 0,
      currentFieldIndex: 0,
      totalFields: 0,
      completedFields: 0,
      failedFields: 0,
      message: '',
    }
  );
}

export function controlPageTyping(action: 'pause' | 'resume' | 'stop'): TypingSessionStatus {
  type SessionWindow = Window & {
    __ktsSession?: {
      status: TypingSessionStatus;
      paused: boolean;
      stopped: boolean;
    };
  };

  const session = (window as SessionWindow).__ktsSession;
  if (!session) {
    return {
      sessionId: null,
      mode: null,
      phase: 'idle',
      progress: 0,
      currentFieldIndex: 0,
      totalFields: 0,
      completedFields: 0,
      failedFields: 0,
      message: '',
    };
  }

  if (action === 'pause' && ['delaying', 'running'].includes(session.status.phase)) {
    session.paused = true;
    session.status.phase = 'paused';
    session.status.message = 'Typing paused';
  } else if (action === 'resume' && session.status.phase === 'paused') {
    session.paused = false;
    session.status.phase = 'running';
    session.status.message = 'Typing resumed';
  } else if (
    action === 'stop' &&
    !['stopped', 'completed', 'failed', 'idle'].includes(session.status.phase)
  ) {
    session.stopped = true;
    session.paused = false;
    session.status.phase = 'stopping';
    session.status.message = 'Stopping typing';
  }

  return { ...session.status };
}

export function cleanupPageScan(scanToken?: string): void {
  type ScanWindow = Window & {
    __ktsScan?: {
      token: string;
      elements: Map<string, Element>;
      cleanupTimer?: number;
    };
  };

  const scanWindow = window as ScanWindow;
  const activeToken = scanToken ?? scanWindow.__ktsScan?.token;
  if (!activeToken) return;

  for (const element of document.querySelectorAll(
    `[data-kts-scan-token="${CSS.escape(activeToken)}"]`
  )) {
    element.removeAttribute('data-kts-scan-token');
    element.removeAttribute('data-kts-field-id');
  }

  document.getElementById(`kts-scan-style-${activeToken}`)?.remove();
  if (scanWindow.__ktsScan?.token === activeToken) {
    if (scanWindow.__ktsScan.cleanupTimer) clearTimeout(scanWindow.__ktsScan.cleanupTimer);
    scanWindow.__ktsScan = undefined;
  }
}

export function scanPageForTypingFields(): ScanResult {
  type ScanWindow = Window & {
    __ktsScan?: {
      token: string;
      elements: Map<string, Element>;
      cleanupTimer?: number;
    };
  };

  const scanWindow = window as ScanWindow;
  if (scanWindow.__ktsScan) {
    const previousToken = scanWindow.__ktsScan.token;
    if (scanWindow.__ktsScan.cleanupTimer) clearTimeout(scanWindow.__ktsScan.cleanupTimer);
    for (const element of document.querySelectorAll(
      `[data-kts-scan-token="${CSS.escape(previousToken)}"]`
    )) {
      element.removeAttribute('data-kts-scan-token');
      element.removeAttribute('data-kts-field-id');
    }
    document.getElementById(`kts-scan-style-${previousToken}`)?.remove();
  }

  const scanToken =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const elementRegistry = new Map<string, Element>();
  const fields: DetectedField[] = [];
  const selector = [
    'input[type="text"]',
    'input[type="email"]',
    'input[type="search"]',
    'input[type="url"]',
    'input[type="tel"]',
    'input:not([type])',
    'textarea',
    '[contenteditable="true"]',
    '[contenteditable=""]',
  ].join(',');

  const getLabel = (element: Element, fallback: string): string => {
    if (element.id) {
      const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (label?.textContent?.trim()) return label.textContent.trim();
    }

    const parentLabel = element.closest('label')?.textContent?.trim();
    if (parentLabel) return parentLabel;

    const ariaLabel = element.getAttribute('aria-label')?.trim();
    if (ariaLabel) return ariaLabel;

    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const label = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(' ');
      if (label) return label;
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (element.placeholder.trim()) return element.placeholder.trim();
      if (element.name.trim()) return element.name.trim();
    }

    return fallback;
  };

  for (const element of document.querySelectorAll(selector)) {
    if (!(element instanceof HTMLElement)) continue;
    if (
      (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
      (element.disabled || element.readOnly)
    ) {
      continue;
    }

    const style = window.getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      bounds.width < 10 ||
      bounds.height < 10
    ) {
      continue;
    }

    const id = `field-${fields.length + 1}`;
    const elementType: DetectedField['elementType'] =
      element instanceof HTMLTextAreaElement
        ? 'textarea'
        : element.isContentEditable
          ? 'contenteditable'
          : 'input';
    const displaySelector = element.id
      ? `#${CSS.escape(element.id)}`
      : element instanceof HTMLInputElement && element.name
        ? `${element.tagName.toLowerCase()}[name="${CSS.escape(element.name)}"]`
        : `${element.tagName.toLowerCase()} (${fields.length + 1})`;

    element.setAttribute('data-kts-scan-token', scanToken);
    element.setAttribute('data-kts-field-id', id);
    elementRegistry.set(id, element);
    fields.push({
      id,
      scanToken,
      priority: fields.length + 1,
      label: getLabel(element, `Field ${fields.length + 1}`),
      text: '',
      enabled: true,
      selector: displaySelector,
      elementType,
      placeholder:
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
          ? element.placeholder
          : undefined,
    });
  }

  if (fields.length > 0) {
    const style = document.createElement('style');
    style.id = `kts-scan-style-${scanToken}`;
    style.textContent = `[data-kts-scan-token="${CSS.escape(scanToken)}"] { outline: 2px solid rgba(37, 99, 235, 0.75) !important; outline-offset: 2px !important; }`;
    (document.head ?? document.documentElement).append(style);
  }

  scanWindow.__ktsScan = { token: scanToken, elements: elementRegistry };
  scanWindow.__ktsScan.cleanupTimer = window.setTimeout(() => {
    for (const element of document.querySelectorAll(
      `[data-kts-scan-token="${CSS.escape(scanToken)}"]`
    )) {
      element.removeAttribute('data-kts-scan-token');
      element.removeAttribute('data-kts-field-id');
    }
    document.getElementById(`kts-scan-style-${scanToken}`)?.remove();
    if (scanWindow.__ktsScan?.token === scanToken) scanWindow.__ktsScan = undefined;
  }, 120_000);
  return { fields, scanToken };
}

export function startPageTyping(request: PageTypingRequest): TypingSessionStartResult {
  type EditableElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;
  type PageSession = {
    status: TypingSessionStatus;
    paused: boolean;
    stopped: boolean;
    audioContext: AudioContext | null;
  };
  type SessionWindow = Window & {
    __ktsSession?: PageSession;
    __ktsScan?: {
      token: string;
      elements: Map<string, Element>;
      cleanupTimer?: number;
    };
  };

  const sessionWindow = window as SessionWindow;
  const previousSession = sessionWindow.__ktsSession;
  if (
    previousSession &&
    !['idle', 'stopped', 'completed', 'failed'].includes(previousSession.status.phase)
  ) {
    return {
      ok: false,
      errorCode: 'ACTIVE_SESSION',
      status: { ...previousSession.status, message: 'A typing session is already active' },
    };
  }

  const isEditable = (element: Element | null): element is EditableElement => {
    if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
    if (element instanceof HTMLInputElement) {
      return (
        ['text', 'email', 'search', 'url', 'tel', ''].includes(element.type) &&
        !element.disabled &&
        !element.readOnly
      );
    }
    return element instanceof HTMLElement && element.isContentEditable;
  };

  const fields =
    request.mode === 'basic'
      ? [
          {
            element: document.activeElement,
            text: request.text ?? '',
            label: 'Selected field',
          },
        ]
      : (request.fields ?? []).map((field) => ({
          element:
            sessionWindow.__ktsScan?.token === field.scanToken
              ? (sessionWindow.__ktsScan.elements.get(field.id) ?? null)
              : document.querySelector(
                  `[data-kts-scan-token="${CSS.escape(field.scanToken)}"][data-kts-field-id="${CSS.escape(field.id)}"]`
                ),
          text: field.text,
          label: field.label,
        }));

  if (fields.length === 0 || fields.some((field) => !field.text.trim())) {
    const status: TypingSessionStatus = {
      sessionId: null,
      mode: request.mode,
      phase: 'failed',
      progress: 0,
      currentFieldIndex: 0,
      totalFields: fields.length,
      completedFields: 0,
      failedFields: 0,
      message: 'Add text for at least one editable field',
    };
    return { ok: false, errorCode: 'EMPTY_TEXT', status };
  }

  if (fields.some((field) => !isEditable(field.element) || !field.element.isConnected)) {
    const status: TypingSessionStatus = {
      sessionId: null,
      mode: request.mode,
      phase: 'failed',
      progress: 0,
      currentFieldIndex: 0,
      totalFields: fields.length,
      completedFields: 0,
      failedFields: 0,
      message:
        request.mode === 'basic'
          ? 'Focus an editable text field on the page and try again'
          : 'One or more fields changed after scanning. Scan the page again.',
    };
    return { ok: false, errorCode: 'INVALID_TARGET', status };
  }

  const sessionId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const status: TypingSessionStatus = {
    sessionId,
    mode: request.mode,
    phase: 'validating',
    progress: 0,
    currentFieldIndex: 0,
    totalFields: fields.length,
    completedFields: 0,
    failedFields: 0,
    message: 'Preparing typing session',
  };
  const session: PageSession = {
    status,
    paused: false,
    stopped: false,
    audioContext: null,
  };
  sessionWindow.__ktsSession = session;

  const setValue = (
    element: EditableElement,
    value: string,
    inputType: string,
    data: string | null
  ) => {
    const beforeInput = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data,
      inputType,
    });
    if (!element.dispatchEvent(beforeInput)) return false;

    if (element instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(element, value);
    } else if (element instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(element, value);
    } else {
      element.textContent = value;
    }

    element.dispatchEvent(new InputEvent('input', { bubbles: true, data, inputType }));
    return true;
  };

  const getValue = (element: EditableElement) =>
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? element.value
      : (element.textContent ?? '');

  const wait = async (milliseconds: number) => {
    let remaining = Math.max(0, milliseconds);
    while (remaining > 0) {
      if (session.stopped) throw new Error('SESSION_STOPPED');
      if (session.paused) {
        await new Promise((resolve) => window.setTimeout(resolve, 50));
        continue;
      }
      const slice = Math.min(remaining, 50);
      await new Promise((resolve) => window.setTimeout(resolve, slice));
      remaining -= slice;
    }
  };

  const getDelay = () => {
    const delay = Math.max(10, request.typingConfig.delay);
    return request.typingConfig.typingStyle === 'random'
      ? delay * (0.5 + Math.random() * 2)
      : delay;
  };

  const playSound = () => {
    if (!request.typingConfig.soundEnabled || !session.audioContext) return;
    const oscillator = session.audioContext.createOscillator();
    const gain = session.audioContext.createGain();
    oscillator.connect(gain);
    gain.connect(session.audioContext.destination);
    oscillator.frequency.value = 760 + Math.random() * 160;
    oscillator.type = 'square';
    gain.gain.setValueAtTime(0.035, session.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, session.audioContext.currentTime + 0.06);
    oscillator.start();
    oscillator.stop(session.audioContext.currentTime + 0.06);
  };

  const cleanupScan = () => {
    if (request.mode !== 'advanced') return;
    const tokens = new Set((request.fields ?? []).map((field) => field.scanToken));
    for (const token of tokens) {
      for (const element of document.querySelectorAll(
        `[data-kts-scan-token="${CSS.escape(token)}"]`
      )) {
        element.removeAttribute('data-kts-scan-token');
        element.removeAttribute('data-kts-field-id');
      }
      document.getElementById(`kts-scan-style-${token}`)?.remove();
      if (sessionWindow.__ktsScan?.token === token) {
        if (sessionWindow.__ktsScan.cleanupTimer) {
          clearTimeout(sessionWindow.__ktsScan.cleanupTimer);
        }
        sessionWindow.__ktsScan = undefined;
      }
    }
  };

  const run = async () => {
    const totalCharacters = Math.max(
      1,
      fields.reduce((total, field) => total + field.text.length, 0)
    );
    let typedCharacters = 0;

    try {
      if (request.typingConfig.soundEnabled) {
        try {
          session.audioContext = new AudioContext();
        } catch {
          session.audioContext = null;
        }
      }

      const initialDelay = request.advancedConfig?.initialDelay ?? 0;
      if (initialDelay > 0) {
        status.phase = 'delaying';
        status.message = `Starting in ${initialDelay} seconds`;
        await wait(initialDelay * 1000);
      }

      for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
        if (session.stopped) throw new Error('SESSION_STOPPED');
        const field = fields[fieldIndex];
        if (!isEditable(field.element) || !field.element.isConnected) {
          status.failedFields += 1;
          continue;
        }

        status.phase = 'running';
        status.currentFieldIndex = fieldIndex;
        status.message = `Typing into ${field.label}`;
        field.element.scrollIntoView({ block: 'center' });
        field.element.focus();
        if (!setValue(field.element, '', 'deleteContentBackward', null)) {
          status.failedFields += 1;
          continue;
        }

        const chunks =
          request.typingConfig.typingStyle === 'word-by-word'
            ? (field.text.match(/\S+\s*/g) ?? [])
            : Array.from(field.text);

        for (const chunk of chunks) {
          if (session.stopped) throw new Error('SESSION_STOPPED');
          while (session.paused) await wait(50);

          const currentValue = getValue(field.element);
          if (
            request.typingConfig.includeMistakes &&
            chunk.length === 1 &&
            typedCharacters > 0 &&
            Math.random() < 0.03
          ) {
            const wrongCharacter = 'qwertyuiopasdfghjklzxcvbnm'[Math.floor(Math.random() * 26)];
            setValue(field.element, currentValue + wrongCharacter, 'insertText', wrongCharacter);
            playSound();
            await wait(getDelay() * 1.5);
            setValue(field.element, currentValue, 'deleteContentBackward', null);
            await wait(getDelay());
          }

          if (!setValue(field.element, getValue(field.element) + chunk, 'insertText', chunk)) {
            throw new Error('INPUT_REJECTED');
          }
          playSound();
          typedCharacters += chunk.length;
          status.progress = Math.min(100, (typedCharacters / totalCharacters) * 100);
          await wait(
            request.typingConfig.typingStyle === 'word-by-word' ? getDelay() * 3 : getDelay()
          );
        }

        field.element.dispatchEvent(new Event('change', { bubbles: true }));
        status.completedFields += 1;

        const interFieldDelay = request.advancedConfig?.interFieldDelay ?? 0;
        if (fieldIndex < fields.length - 1 && interFieldDelay > 0) {
          status.phase = 'delaying';
          status.message = 'Waiting for the next field';
          await wait(interFieldDelay * 1000);
        }
      }

      status.progress = 100;
      status.phase = status.failedFields > 0 ? 'failed' : 'completed';
      status.message =
        status.failedFields > 0
          ? `Completed ${status.completedFields} fields; ${status.failedFields} failed`
          : 'Typing completed';
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_STOPPED') {
        status.phase = 'stopped';
        status.message = 'Typing stopped';
      } else {
        status.phase = 'failed';
        status.message = 'Typing failed before completion';
      }
    } finally {
      cleanupScan();
      if (session.audioContext) {
        void session.audioContext.close();
        session.audioContext = null;
      }
    }
  };

  void run();
  return { ok: true, status: { ...status } };
}
