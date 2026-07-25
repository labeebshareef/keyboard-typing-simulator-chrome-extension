import { ChevronRight } from 'lucide-react';
import type React from 'react';

interface CollapsibleProps {
  id: string;
  title: string;
  /** Compact summary of current values, shown in the header while collapsed. */
  summary?: string;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  children: React.ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({
  id,
  title,
  summary,
  expanded,
  onToggle,
  children,
}) => {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => onToggle(!expanded)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left
                   hover:bg-black/5 dark:hover:bg-white/5"
      >
        <ChevronRight
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200
                     ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-xs font-semibold text-[var(--text)]">{title}</span>
        {!expanded && summary && (
          <span className="ml-auto truncate text-xs text-[var(--text-muted)]">{summary}</span>
        )}
      </button>
      {expanded && (
        <div id={id} className="space-y-3 border-t border-[var(--border)] px-3 py-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default Collapsible;
