import { Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import type { AssistantPreferences } from '../types';
import Switch from './Switch';

interface AssistantToggleProps {
  assistant: AssistantPreferences;
  updateAssistant: (updates: Partial<AssistantPreferences>) => void;
}

/** Injected check: is the assistant currently mounted on this page? */
const isAssistantMounted = () =>
  Boolean((window as Window & { __ktsAssistant?: { mounted: boolean } }).__ktsAssistant?.mounted);

/**
 * The field assistant's master switch — a prominent row under the popup
 * header (deliberately NOT buried in the gear menu).
 *
 * Because there is no content script and no host permission, icons can only
 * live on a page while a script is injected there — they cannot persist
 * across navigation. So the switch has to *do* the injection, not just flip a
 * flag: turning it ON summons the icons on the current tab immediately;
 * turning it OFF removes them. And when the popup opens with the feature on,
 * we (re)summon on the current tab automatically — that's what makes
 * "the toggle is on, so the icon is there" actually true after navigating.
 */
const AssistantToggle: React.FC<AssistantToggleProps> = ({ assistant, updateAssistant }) => {
  // null = unknown / not injectable (e.g. chrome:// pages, the web store)
  const [activeOnPage, setActiveOnPage] = useState<boolean | null>(null);
  const [working, setWorking] = useState(false);

  const getInjectableTabId = useCallback(async (): Promise<number | null> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return null;
      if (
        /^(chrome|edge|about|chrome-extension|moz-extension|https:\/\/chromewebstore)/.test(
          tab.url ?? ''
        )
      ) {
        return null;
      }
      return tab.id;
    } catch {
      return null;
    }
  }, []);

  const readMounted = useCallback(async (tabId: number): Promise<boolean | null> => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: isAssistantMounted,
      });
      return results[0]?.result === true;
    } catch {
      return null;
    }
  }, []);

  /** Inject the assistant file, which toggles mount state on the page. */
  const runInjection = useCallback(
    async (tabId: number): Promise<boolean | null> => {
      try {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['assistant.js'] });
        return await readMounted(tabId);
      } catch {
        return null;
      }
    },
    [readMounted]
  );

  /** Drive the current page toward `active`, injecting only if state differs. */
  const applyToPage = useCallback(
    async (active: boolean) => {
      const tabId = await getInjectableTabId();
      if (tabId === null) {
        setActiveOnPage(null);
        return;
      }
      setWorking(true);
      try {
        const mounted = await readMounted(tabId);
        if (mounted === null) {
          setActiveOnPage(null);
          return;
        }
        if (mounted === active) {
          setActiveOnPage(mounted);
          return;
        }
        setActiveOnPage(await runInjection(tabId));
      } finally {
        setWorking(false);
      }
    },
    [getInjectableTabId, readMounted, runInjection]
  );

  // On popup open: reflect real page state, and if the feature is on, make
  // sure the icons are actually present on this tab (the fix for "switch is
  // on but nothing shows" after a navigation). Runs once on mount; the switch
  // handler covers subsequent changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only sync
  useEffect(() => {
    if (assistant.enabled) {
      void applyToPage(true);
    } else {
      void getInjectableTabId().then((tabId) =>
        tabId === null ? setActiveOnPage(null) : void readMounted(tabId).then(setActiveOnPage)
      );
    }
  }, []);

  const handleSwitch = (checked: boolean) => {
    updateAssistant({ enabled: checked });
    void applyToPage(checked);
  };

  const subLabel = !assistant.enabled
    ? 'Off — icons never appear on pages.'
    : activeOnPage === null
      ? "This page doesn't allow the assistant. Open a normal website."
      : activeOnPage
        ? 'On for this page — click any text field. Alt+Shift+A hides it.'
        : 'Show AI icons on this page (or press Alt+Shift+A).';

  const canToggleOnPage = assistant.enabled && activeOnPage !== null;

  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-500" />
        <span className="text-xs font-semibold text-[var(--text)]">Field assistant</span>
        <div className="ml-auto">
          <Switch
            checked={assistant.enabled}
            onChange={handleSwitch}
            disabled={working}
            ariaLabel="Enable the field assistant"
          />
        </div>
      </div>
      {canToggleOnPage ? (
        <button
          type="button"
          onClick={() => void applyToPage(!activeOnPage)}
          disabled={working}
          className="mt-1 text-left text-[11px] text-primary-600 hover:underline
                     disabled:cursor-wait disabled:opacity-60 dark:text-primary-400"
        >
          {working ? 'Working…' : activeOnPage ? 'Hide on this page' : subLabel}
        </button>
      ) : (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">{subLabel}</p>
      )}
    </div>
  );
};

export default AssistantToggle;
