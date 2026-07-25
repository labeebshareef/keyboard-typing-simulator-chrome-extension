import { Check, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { ThemePreference } from '../types';

interface HeaderMenuProps {
  theme: ThemePreference;
  updateTheme: (theme: ThemePreference) => void;
  version: string;
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Gear menu in the header: set-and-forget preferences (theme) + about. */
const HeaderMenu: React.FC<HeaderMenuProps> = ({ theme, updateTheme, version }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Extension settings"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-center rounded-md p-1.5 text-[var(--text-muted)]
                   transition-colors hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
      >
        <Settings aria-hidden="true" className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Extension settings"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-[var(--border)]
                     bg-[var(--surface-raised)] py-1 shadow-lg"
        >
          <p className="px-3 pb-1 pt-1.5 text-xs font-semibold text-[var(--text-muted)]">Theme</p>
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === option.value}
              onClick={() => {
                updateTheme(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs
                         text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className="w-3.5">
                {theme === option.value && (
                  <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary-500" />
                )}
              </span>
              {option.label}
            </button>
          ))}
          <div className="my-1 border-t border-[var(--border)]" />
          <p className="px-3 py-1 text-xs text-[var(--text-muted)]">
            Keyboard Typing Simulator {version}
          </p>
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
