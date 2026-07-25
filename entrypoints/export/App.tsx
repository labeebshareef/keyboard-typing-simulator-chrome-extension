import { Clapperboard, Download, Play, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { TypingConfig, TypingStyle } from '../popup/types';
import { defaultPreferences } from '../popup/utils/preferences';
import { buildTypingTimeline, textAt } from '../popup/utils/typing-timeline';
import { GIF_FRAME_SOFT_LIMIT, downloadBlob, encodeGif, encodeWebM } from './encoders';
import { SIZE_PRESETS, THEMES, type ThemeId, drawEndFrame, drawFrame } from './renderer';

const END_FRAME_MS = 1500;
const SPEED_OPTIONS = [0.5, 1, 2, 4];

interface ExportPayload {
  text: string;
  typingConfig: TypingConfig;
}

type Busy = 'idle' | 'preview' | 'webm' | 'gif';

/**
 * Standalone export page: turns any text into a typing video (WebM) or GIF.
 * Opened from the popup with the current script pre-loaded via
 * chrome.storage.session, but fully usable on its own.
 */
const App: React.FC = () => {
  const [text, setText] = useState('');
  const [typingStyle, setTypingStyle] = useState<TypingStyle>('normal');
  const [delay, setDelay] = useState(defaultPreferences.typing.delay);
  const [includeMistakes, setIncludeMistakes] = useState(true);
  const [themeId, setThemeId] = useState<ThemeId>('clean');
  const [sizeId, setSizeId] = useState('readme');
  const [speed, setSpeed] = useState(1);
  const [endFrame, setEndFrame] = useState(true);
  const [busy, setBusy] = useState<Busy>('idle');
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewRafRef = useRef<number>(0);

  const theme = THEMES.find((entry) => entry.id === themeId) ?? THEMES[0];
  const size = SIZE_PRESETS.find((entry) => entry.id === sizeId) ?? SIZE_PRESETS[0];

  // Pull the script handed over by the popup, if any.
  useEffect(() => {
    void (async () => {
      try {
        const stored = await chrome.storage.session.get('exportPayload');
        const payload = stored.exportPayload as ExportPayload | undefined;
        if (payload?.text) {
          setText(payload.text);
          setTypingStyle(payload.typingConfig.typingStyle);
          setDelay(payload.typingConfig.delay);
          setIncludeMistakes(payload.typingConfig.includeMistakes);
        }
      } catch {
        // Opened standalone (or storage unavailable) — start empty.
      }
    })();
  }, []);

  const buildTimeline = useCallback(
    () =>
      buildTypingTimeline(
        text,
        { delay, typingStyle, includeMistakes },
        { speedMultiplier: speed }
      ),
    [delay, includeMistakes, speed, text, typingStyle]
  );

  const makeDrawAt = useCallback(
    (timeline: ReturnType<typeof buildTimeline>) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) return null;
      canvas.width = size.width;
      canvas.height = size.height;
      return (t: number) => {
        if (endFrame && t >= timeline.duration + 250) {
          drawEndFrame(context, size);
          return;
        }
        drawFrame(context, {
          theme,
          size,
          text: textAt(timeline, t),
          elapsed: t,
          typing: t < timeline.duration,
        });
      };
    },
    [endFrame, size, theme]
  );

  const stop = () => {
    abortRef.current?.abort();
    cancelAnimationFrame(previewRafRef.current);
    setBusy('idle');
    setProgress(0);
  };

  // Draw a static frame whenever settings change while idle.
  useEffect(() => {
    if (busy !== 'idle') return;
    const timeline = buildTimeline();
    const drawAt = makeDrawAt(timeline);
    drawAt?.(timeline.duration + (endFrame ? END_FRAME_MS : 0));
  }, [busy, buildTimeline, endFrame, makeDrawAt]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: unmount-only cleanup
  useEffect(() => () => stop(), []);

  const handlePreview = () => {
    const timeline = buildTimeline();
    const drawAt = makeDrawAt(timeline);
    if (!drawAt) return;
    setBusy('preview');
    const total = timeline.duration + (endFrame ? END_FRAME_MS : 0);
    const startedAt = performance.now();
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      drawAt(Math.min(elapsed, total));
      setProgress(Math.min(1, elapsed / total));
      if (elapsed < total) {
        previewRafRef.current = requestAnimationFrame(tick);
      } else {
        setBusy('idle');
        setProgress(0);
      }
    };
    previewRafRef.current = requestAnimationFrame(tick);
  };

  const runExport = async (kind: 'webm' | 'gif') => {
    const timeline = buildTimeline();
    const drawAt = makeDrawAt(timeline);
    const canvas = canvasRef.current;
    if (!drawAt || !canvas) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(kind);
    setProgress(0);
    setNote(
      kind === 'webm'
        ? 'Recording in real time — keep this tab focused so no frames are dropped.'
        : 'Encoding GIF frames…'
    );
    try {
      const job = {
        canvas,
        drawAt,
        durationMs: timeline.duration,
        endFrameMs: endFrame ? END_FRAME_MS : 0,
        onProgress: setProgress,
        signal: controller.signal,
      };
      const blob = kind === 'webm' ? await encodeWebM(job) : await encodeGif(job);
      downloadBlob(blob, kind === 'webm' ? 'ghosttype-typing.webm' : 'ghosttype-typing.gif');
      setNote(`Done — saved ghosttype-typing.${kind === 'webm' ? 'webm' : 'gif'}.`);
    } catch (error) {
      setNote(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Export cancelled.'
          : 'Export failed. Try a smaller size or shorter text.'
      );
    } finally {
      setBusy('idle');
      setProgress(0);
      abortRef.current = null;
    }
  };

  const timelinePreview = buildTypingTimeline(
    text,
    { delay, typingStyle, includeMistakes },
    { seed: 1, speedMultiplier: speed }
  );
  const clipSeconds =
    Math.round((timelinePreview.duration + (endFrame ? END_FRAME_MS : 0)) / 100) / 10;
  const gifFrames = Math.ceil(
    (timelinePreview.duration + (endFrame ? END_FRAME_MS : 0)) / (1000 / 15)
  );
  const gifHeavy = gifFrames > GIF_FRAME_SOFT_LIMIT;
  const isBusy = busy !== 'idle';

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center gap-2">
        <Clapperboard aria-hidden="true" className="h-5 w-5 text-primary-500" />
        <h1 className="text-lg font-semibold">GhostType — Typing video export</h1>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          ~{clipSeconds}s clip · runs entirely on your machine
        </span>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Preview */}
        <div className="min-w-0 flex-1 space-y-3">
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg border border-[var(--border)] bg-white shadow-sm"
            aria-label="Typing animation preview"
          />
          <div className="flex items-center gap-2">
            {isBusy ? (
              <button
                type="button"
                onClick={stop}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3
                           py-1.5 text-sm font-medium text-[var(--text)] hover:bg-black/5"
              >
                <Square aria-hidden="true" className="h-3.5 w-3.5" /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePreview}
                disabled={!text.trim()}
                className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3
                           py-1.5 text-sm font-medium text-[var(--text)] hover:bg-black/5
                           disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play aria-hidden="true" className="h-3.5 w-3.5" /> Preview
              </button>
            )}
            {(isBusy || progress > 0) && (
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-primary-500 transition-[width]"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            )}
          </div>
          <p aria-live="polite" className="min-h-4 text-xs text-[var(--text-muted)]">
            {note}
          </p>
        </div>

        {/* Controls */}
        <div className="w-full shrink-0 space-y-4 lg:w-80">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Text</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={isBusy}
              placeholder="Paste or write the text to animate…"
              className="h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-white
                         px-3 py-2 text-sm focus:border-transparent focus:ring-2
                         focus:ring-primary-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Theme</span>
              <select
                value={themeId}
                onChange={(event) => setThemeId(event.target.value as ThemeId)}
                disabled={isBusy}
                className="w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm"
              >
                {THEMES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Size</span>
              <select
                value={sizeId}
                onChange={(event) => setSizeId(event.target.value)}
                disabled={isBusy}
                className="w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm"
              >
                {SIZE_PRESETS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Typing style</span>
              <select
                value={typingStyle}
                onChange={(event) => setTypingStyle(event.target.value as TypingStyle)}
                disabled={isBusy}
                className="w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm"
              >
                <option value="normal">Steady</option>
                <option value="random">Natural (random)</option>
                <option value="word-by-word">Word by word</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Speed</span>
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                disabled={isBusy}
                className="w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm"
              >
                {SPEED_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}×
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeMistakes}
              onChange={(event) => setIncludeMistakes(event.target.checked)}
              disabled={isBusy}
              className="h-4 w-4 accent-primary-500"
            />
            Include realistic typos
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={endFrame}
              onChange={(event) => setEndFrame(event.target.checked)}
              disabled={isBusy}
              className="h-4 w-4 accent-primary-500"
            />
            End with a “Typed with GhostType” frame
          </label>

          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={() => void runExport('webm')}
              disabled={isBusy || !text.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500
                         px-4 py-2.5 font-semibold text-white hover:bg-primary-600
                         disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export WebM video
            </button>
            <button
              type="button"
              onClick={() => void runExport('gif')}
              disabled={isBusy || !text.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-md border
                         border-[var(--border)] px-4 py-2.5 font-semibold text-[var(--text)]
                         hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export GIF
            </button>
            {gifHeavy && (
              <p className="text-xs text-amber-600">
                This clip is long (~{gifFrames} GIF frames) — the GIF will be large and slow to
                encode. WebM is the better format here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
