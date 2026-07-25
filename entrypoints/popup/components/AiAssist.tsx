import { Download, Sparkles, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { AiControls } from '../hooks/useAi';
import {
  DEMO_PRESETS,
  REWRITE_MODES,
  type RewriteMode,
  streamGeneration,
  streamRewrite,
} from '../utils/ai';
import { LOCAL_DEMO_TEXTS } from '../utils/sample-data';

interface AiAssistProps {
  ai: AiControls;
  text: string;
  setText: (text: string) => void;
  disabled: boolean;
}

/**
 * "AI Assist" section under the Text-to-Type box.
 *
 * Four states, no dead buttons:
 * - available    → presets + freeform prompt + rewrite chips, streamed via Nano
 * - downloadable → presets insert local samples instantly; explicit
 *                  "Enable on-device AI" button (the required user gesture)
 * - downloading  → progress bar; presets still work locally
 * - unavailable  → presets insert local samples; one-line explainer
 */
const AiAssist: React.FC<AiAssistProps> = ({ ai, text, setText, disabled }) => {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [prompt, setPrompt] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight generation when the popup unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const aiReady = ai.availability === 'available';
  const canUseControls = !disabled && !busy;

  const runStream = async (
    run: (signal: AbortSignal) => Promise<string>,
    fallback?: () => void
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setNote('');
    try {
      await run(controller.signal);
    } catch {
      if (!controller.signal.aborted) {
        if (fallback) {
          fallback();
          setNote('AI generation failed — inserted a built-in sample instead.');
        } else {
          setNote('AI generation failed. Try again.');
        }
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const handlePreset = async (presetId: string) => {
    const preset = DEMO_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) return;

    if (!aiReady) {
      setText(LOCAL_DEMO_TEXTS[preset.id] ?? '');
      setNote('Inserted a built-in sample. Enable on-device AI for generated text.');
      return;
    }
    const session = await ai.ensureSession();
    if (!session) {
      setText(LOCAL_DEMO_TEXTS[preset.id] ?? '');
      return;
    }
    await runStream(
      (signal) => streamGeneration(session, preset.instruction, setText, signal),
      () => setText(LOCAL_DEMO_TEXTS[preset.id] ?? '')
    );
  };

  const handleFreeform = async () => {
    const instruction = prompt.trim();
    if (!instruction) return;
    const session = await ai.ensureSession();
    if (!session) return;
    await runStream((signal) =>
      streamGeneration(
        session,
        `Write short plain text to type in a demo: ${instruction}`,
        setText,
        signal
      )
    );
  };

  const handleRewrite = async (mode: RewriteMode) => {
    if (!text.trim()) return;
    const session = await ai.ensureSession();
    if (!session) return;
    const original = text;
    await runStream(
      (signal) => streamRewrite(session, mode, original, setText, signal),
      () => setText(original)
    );
  };

  const handleEnable = async () => {
    setNote('');
    const session = await ai.ensureSession();
    if (!session) {
      setNote(
        'Could not enable on-device AI. Check free disk space (~22 GB needed) and try again.'
      );
    }
  };

  return (
    <section aria-label="AI assist" className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-primary-500" />
        <h2 className="text-xs font-semibold text-[var(--text)]">AI Assist</h2>
        {busy && (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]
                       font-medium text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text)]
                       dark:hover:bg-white/5"
          >
            <Square aria-hidden="true" className="h-2.5 w-2.5" />
            Stop
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DEMO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={!canUseControls}
            onClick={() => void handlePreset(preset.id)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5
                       py-1 text-[11px] text-[var(--text)] transition-colors hover:border-primary-400
                       hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50
                       dark:hover:text-primary-400"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {aiReady && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleFreeform();
            }}
            placeholder="Describe what to generate…"
            disabled={!canUseControls}
            className="min-w-0 flex-1 rounded-md border border-[var(--border)]
                       bg-[var(--surface-raised)] px-2.5 py-1.5 text-xs text-[var(--text)]
                       placeholder:text-gray-400 focus:border-transparent focus:ring-2
                       focus:ring-primary-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void handleFreeform()}
            disabled={!canUseControls || !prompt.trim()}
            className="rounded-md bg-primary-500 px-2.5 py-1.5 text-xs font-semibold text-white
                       transition-colors hover:bg-primary-600 disabled:cursor-not-allowed
                       disabled:bg-gray-300"
          >
            Generate
          </button>
        </div>
      )}

      {aiReady && text.trim() && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)]">Rewrite:</span>
          {REWRITE_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={!canUseControls}
              onClick={() => void handleRewrite(mode.id)}
              className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px]
                         text-[var(--text-muted)] transition-colors hover:border-primary-400
                         hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50
                         dark:hover:text-primary-400"
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}

      {ai.availability === 'downloadable' && (
        <button
          type="button"
          onClick={() => void handleEnable()}
          disabled={disabled}
          className="flex w-full items-center gap-2 rounded-md border border-dashed
                     border-[var(--border)] px-2.5 py-1.5 text-left text-[11px]
                     text-[var(--text-muted)] transition-colors hover:border-primary-400
                     hover:text-[var(--text)]"
        >
          <Download aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary-500" />
          <span>
            <span className="font-medium text-[var(--text)]">Enable on-device AI.</span> One-time
            model download (a few GB, ~22 GB free disk needed). Runs 100% locally.
          </span>
        </button>
      )}

      {ai.availability === 'downloading' && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
            <div
              className="h-1.5 rounded-full bg-primary-500 transition-[width] duration-300"
              style={{ width: `${ai.downloadProgress ?? 0}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Downloading the on-device model ({ai.downloadProgress ?? 0}%) — you can close this
            popup, the download continues.
          </p>
        </div>
      )}

      {ai.availability === 'unavailable' && (
        <p className="text-[10px] leading-snug text-[var(--text-muted)]">
          Presets insert built-in samples. On-device AI generation needs Chrome 138+ on a supported
          desktop.
        </p>
      )}

      {note && (
        <p aria-live="polite" className="text-[10px] text-[var(--text-muted)]">
          {note}
        </p>
      )}
    </section>
  );
};

export default AiAssist;
