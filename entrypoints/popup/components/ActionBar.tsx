import { Pause, Play, Square } from 'lucide-react';
import type React from 'react';
import type { TypingSessionStatus } from '../types';

interface ActionBarProps {
  session: {
    status: TypingSessionStatus;
    error: string;
    isActive: boolean;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
  canStart: boolean;
  /** Shown in the status line while idle and start is unavailable. */
  startHint: string;
  onStart: () => void;
}

/**
 * Sticky footer shared by both modes: start/pause/resume/stop, progress,
 * and the status/error line. Pinned in the shell so it never scrolls away.
 */
const ActionBar: React.FC<ActionBarProps> = ({ session, canStart, startHint, onStart }) => {
  const isPaused = session.status.phase === 'paused';
  const progress = Math.round(session.status.progress);

  const statusText =
    session.error ||
    session.status.message ||
    (session.isActive ? '' : canStart ? 'Ready' : startHint);

  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-raised)] px-4 pb-2.5 pt-3">
      {session.isActive ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isPaused ? session.resume : session.pause}
            className="flex items-center justify-center gap-1.5 rounded-md bg-primary-500 px-3 py-2
                       text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            {isPaused ? (
              <Play aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Pause aria-hidden="true" className="h-4 w-4" />
            )}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={session.stop}
            aria-label="Stop typing"
            className="flex items-center justify-center rounded-md bg-red-500 p-2.5 text-white
                       transition-colors hover:bg-red-600"
          >
            <Square aria-hidden="true" className="h-4 w-4" />
          </button>
          <div
            className="flex flex-1 items-center gap-2"
            role="progressbar"
            aria-label="Typing progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            tabIndex={0}
          >
            <div className="h-1.5 flex-1 rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full bg-primary-500 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-9 text-right text-xs font-medium text-[var(--text-muted)]">
              {progress}%
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-500 px-4
                     py-2.5 font-semibold text-white transition-colors hover:bg-primary-600
                     disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Play aria-hidden="true" className="h-4 w-4" />
          Start typing
        </button>
      )}

      <p
        aria-live="polite"
        role={session.error ? 'alert' : 'status'}
        className="mt-1.5 min-h-4 truncate text-xs text-[var(--text-muted)]"
        title={statusText}
      >
        {statusText}
      </p>
    </div>
  );
};

export default ActionBar;
