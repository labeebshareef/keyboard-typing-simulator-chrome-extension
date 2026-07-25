/**
 * Canvas renderer for typing videos/GIFs: themes, word wrap, auto-scroll,
 * blinking caret, and the optional branded end frame.
 */

export type ThemeId = 'clean' | 'terminal' | 'chat';

export interface Theme {
  id: ThemeId;
  label: string;
  background: string;
  text: string;
  caret: string;
  fontFamily: string;
  /** Chat theme draws a bubble behind the text. */
  bubble?: string;
  bubbleText?: string;
}

export const THEMES: Theme[] = [
  {
    id: 'clean',
    label: 'Clean',
    background: '#f8fafc',
    text: '#172033',
    caret: '#5b5bd6',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    background: '#0d1117',
    text: '#e6edf3',
    caret: '#3fb950',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  },
  {
    id: 'chat',
    label: 'Chat bubble',
    background: '#eef1f6',
    text: '#172033',
    caret: '#ffffff',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    bubble: '#5b5bd6',
    bubbleText: '#ffffff',
  },
];

export interface SizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  fontSize: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'readme', label: 'README banner (800×200)', width: 800, height: 200, fontSize: 24 },
  { id: 'hd', label: 'HD video (1280×720)', width: 1280, height: 720, fontSize: 40 },
  { id: 'square', label: 'Square (720×720)', width: 720, height: 720, fontSize: 32 },
];

const CARET_BLINK_MS = 530;

interface FrameOptions {
  theme: Theme;
  size: SizePreset;
  text: string;
  /** Milliseconds since timeline start; drives the caret blink. */
  elapsed: number;
  /** Caret solid (typing) or blinking (idle/finished). */
  typing: boolean;
}

const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line === '' ? word : `${line} ${word}`;
      if (context.measureText(candidate).width <= maxWidth || line === '') {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
};

export function drawFrame(context: CanvasRenderingContext2D, options: FrameOptions): void {
  const { theme, size, text, elapsed, typing } = options;
  const { width, height, fontSize } = size;
  const padding = Math.round(fontSize * 1.2);
  const lineHeight = Math.round(fontSize * 1.45);

  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);
  context.font = `${fontSize}px ${theme.fontFamily}`;
  context.textBaseline = 'top';

  const isChat = theme.id === 'chat';
  const bubblePadding = isChat ? Math.round(fontSize * 0.7) : 0;
  const maxTextWidth = width - padding * 2 - bubblePadding * 2;

  const lines = wrapText(context, text, maxTextWidth);
  const maxVisibleLines = Math.max(
    1,
    Math.floor((height - padding * 2 - bubblePadding * 2) / lineHeight)
  );
  // Auto-scroll: keep the most recent lines in view.
  const visible = lines.slice(-maxVisibleLines);
  const textColor = isChat ? (theme.bubbleText ?? theme.text) : theme.text;

  if (isChat) {
    const widest = visible.reduce((max, line) => Math.max(max, context.measureText(line).width), 0);
    const caretGap = Math.round(fontSize * 0.6);
    const bubbleWidth = Math.min(width - padding * 2, widest + bubblePadding * 2 + caretGap);
    const bubbleHeight = visible.length * lineHeight + bubblePadding * 2;
    context.fillStyle = theme.bubble ?? '#5b5bd6';
    context.beginPath();
    context.roundRect(padding, padding, Math.max(bubbleWidth, fontSize * 2), bubbleHeight, 14);
    context.fill();
  }

  const originX = padding + bubblePadding;
  const originY = padding + bubblePadding;
  context.fillStyle = textColor;
  visible.forEach((line, index) => {
    context.fillText(line, originX, originY + index * lineHeight);
  });

  // Caret after the last visible character.
  const caretOn = typing || Math.floor(elapsed / CARET_BLINK_MS) % 2 === 0;
  if (caretOn) {
    const lastLine = visible[visible.length - 1] ?? '';
    const caretX = originX + context.measureText(lastLine).width + Math.round(fontSize * 0.15);
    const caretY = originY + (visible.length - 1) * lineHeight;
    context.fillStyle = theme.caret;
    context.fillRect(caretX, caretY, Math.max(2, Math.round(fontSize / 11)), fontSize);
  }
}

/** Branded closing frame ("made with" attribution) — optional, one click off. */
export function drawEndFrame(context: CanvasRenderingContext2D, size: SizePreset): void {
  const { width, height, fontSize } = size;
  context.fillStyle = '#5b5bd6';
  context.fillRect(0, 0, width, height);

  const title = 'Typed with GhostType';
  const titleSize = Math.round(fontSize * 1.1);
  context.font = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  const titleWidth = context.measureText(title).width;
  const x = (width - titleWidth) / 2;
  const y = height / 2;
  context.fillText(title, x, y);
  // The brand caret, right after the wordmark.
  context.fillRect(
    x + titleWidth + Math.round(titleSize * 0.25),
    y - titleSize / 2,
    Math.max(3, Math.round(titleSize / 10)),
    titleSize
  );
}
