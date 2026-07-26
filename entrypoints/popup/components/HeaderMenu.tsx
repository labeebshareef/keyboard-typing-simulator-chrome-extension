import { Check, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { ShortcutPreferences, ThemePreference } from '../types';
import { clearLastScript } from '../utils/last-script';

interface HeaderMenuProps {
  theme: ThemePreference;
  updateTheme: (theme: ThemePreference) => void;
  shortcut: ShortcutPreferences;
  updateShortcut: (updates: Partial<ShortcutPreferences>) => void;
  version: string;
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TYPE_COMMAND = 'type-into-focused-field';
const CLIPBOARD_COMMAND = 'type-clipboard-into-field';

/** Gear menu in the header: set-and-forget preferences (theme, shortcut) + about. */
const HeaderMenu: React.FC<HeaderMenuProps> = ({
  theme,
  updateTheme,
  shortcut,
  updateShortcut,
  version,
}) => {
  const [open, setOpen] = useState(false);
  // null = not yet loaded; '' = command exists but has no binding.
  const [typeShortcut, setTypeShortcut] = useState<string | null>(null);
  const [clipboardShortcut, setClipboardShortcut] = useState<string | null>(null);
  const [clipboardEnabled, setClipboardEnabled] = useState(false);
  const [scriptCleared, setScriptCleared] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    setScriptCleared(false);
    void chrome.commands
      .getAll()
      .then((commands) => {
        const typeCommand = commands.find((entry) => entry.name === TYPE_COMMAND);
        setTypeShortcut(typeCommand?.shortcut ?? '');
        const clipboardCommand = commands.find((entry) => entry.name === CLIPBOARD_COMMAND);
        setClipboardShortcut(clipboardCommand?.shortcut ?? '');
      })
      .catch(() => {
        setTypeShortcut('');
        setClipboardShortcut('');
      });
    void chrome.permissions
      .contains({ permissions: ['clipboardRead'] })
      .then(setClipboardEnabled)
      .catch(() => setClipboardEnabled(false));

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

  const openShortcutSettings = () => {
    void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    setOpen(false);
  };

  /**
   * The clipboardRead permission is optional and requested only from this
   * user click; removing it revokes clipboard access entirely.
   */
  const toggleClipboardAccess = (enable: boolean) => {
    if (enable) {
      void chrome.permissions
        .request({ permissions: ['clipboardRead'] })
        .then(setClipboardEnabled)
        .catch(() => setClipboardEnabled(false));
    } else {
      void chrome.permissions
        .remove({ permissions: ['clipboardRead'] })
        .then((removed) => setClipboardEnabled(!removed))
        .catch(() => undefined);
    }
  };

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
          className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-[var(--border)]
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
          <p className="px-3 pb-1 pt-1.5 text-xs font-semibold text-[var(--text-muted)]">
            Keyboard shortcuts
          </p>
          <div className="px-3 pb-1 text-xs text-[var(--text)]">
            {typeShortcut === null ? (
              'Checking…'
            ) : typeShortcut ? (
              <>
                Type into focused field:{' '}
                <kbd
                  className="rounded border border-[var(--border)] bg-black/5 px-1 py-0.5
                             font-mono text-[10px] dark:bg-white/10"
                >
                  {typeShortcut}
                </kbd>
              </>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                Shortcut not set (another extension may be using the default).
              </span>
            )}
          </div>
          <div className="px-3 pb-1 text-xs text-[var(--text)]">
            {clipboardShortcut === null ? null : clipboardShortcut ? (
              <>
                Type clipboard:{' '}
                <kbd
                  className="rounded border border-[var(--border)] bg-black/5 px-1 py-0.5
                             font-mono text-[10px] dark:bg-white/10"
                >
                  {clipboardShortcut}
                </kbd>
              </>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                Clipboard shortcut not set.
              </span>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={clipboardEnabled}
              onChange={(event) => toggleClipboardAccess(event.target.checked)}
              className="h-3.5 w-3.5 accent-primary-500"
            />
            <span className="flex-1">Enable clipboard typing</span>
          </label>
          <p className="px-3 pb-1 text-[10px] leading-snug text-[var(--text-muted)]">
            Lets the shortcut read your clipboard at the moment you press it. Nothing is stored.
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={openShortcutSettings}
            className="w-full px-3 py-1.5 text-left text-xs text-primary-600 hover:bg-black/5
                       dark:text-primary-400 dark:hover:bg-white/5"
          >
            Change shortcuts…
          </button>
          <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={shortcut.persistScript}
              onChange={(event) => updateShortcut({ persistScript: event.target.checked })}
              className="h-3.5 w-3.5 accent-primary-500"
            />
            <span className="flex-1">Remember text after restart</span>
          </label>
          <p className="px-3 pb-1 text-[10px] leading-snug text-[var(--text-muted)]">
            Off: your text is kept in memory only and cleared when the browser closes.
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={scriptCleared}
            onClick={() => {
              void clearLastScript();
              setScriptCleared(true);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-[var(--text)] hover:bg-black/5
                       disabled:cursor-default disabled:text-[var(--text-muted)] dark:hover:bg-white/5"
          >
            {scriptCleared ? 'Saved text cleared' : 'Clear saved text'}
          </button>

          <div className="my-1 border-t border-[var(--border)]" />
          <p className="px-3 py-1 text-xs text-[var(--text-muted)]">TypeReel {version}</p>
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
