import { Sparkles, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { ChangelogEntry } from '../utils/whats-new';
import { markWhatsNewSeen } from '../utils/whats-new';

interface WhatsNewProps {
  entries: ChangelogEntry[];
  onClose: () => void;
}

/**
 * One-time paged release notes shown after an update: one page per version
 * (newest first), stepped through with Next. Closing on any page marks the
 * whole notice as seen — no nagging.
 */
const WhatsNew: React.FC<WhatsNewProps> = ({ entries, onClose }) => {
  const [page, setPage] = useState(0);
  const entry = entries[page];
  const isLast = page >= entries.length - 1;

  const finish = () => {
    void markWhatsNewSeen();
    onClose();
  };

  if (!entry) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-5"
      // biome-ignore lint/a11y/useSemanticElements: native <dialog> needs showModal() for backdrop + modality; a role="dialog" overlay is simpler inside the extension popup
      role="dialog"
      aria-modal="true"
      aria-label="What's new in TypeReel"
    >
      <div className="flex w-full max-w-sm flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-xl">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-primary-500" />
          <h2 className="flex-1 text-sm font-semibold text-[var(--text)]">TypeReel updated</h2>
          <button
            type="button"
            onClick={finish}
            aria-label="Close release notes"
            className="rounded-md p-1 text-[var(--text-muted)] transition-colors
                       hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Version {entry.version}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-[var(--text)]">{entry.title}</h3>
          <ul className="mt-2 space-y-1.5">
            {entry.points.map((point) => (
              <li key={point} className="flex gap-2 text-xs leading-relaxed text-[var(--text)]">
                <span
                  aria-hidden="true"
                  className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary-500"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-3">
          <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
            {entries.length > 1 &&
              entries.map((item, index) => (
                <span
                  key={item.version}
                  className={`h-1.5 rounded-full transition-all ${
                    index === page ? 'w-4 bg-primary-500' : 'w-1.5 bg-[var(--border)]'
                  }`}
                />
              ))}
          </div>
          <button
            type="button"
            onClick={() => (isLast ? finish() : setPage((value) => value + 1))}
            className="rounded-md bg-primary-500 px-4 py-1.5 text-xs font-semibold text-white
                       transition-colors hover:bg-primary-600"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsNew;
