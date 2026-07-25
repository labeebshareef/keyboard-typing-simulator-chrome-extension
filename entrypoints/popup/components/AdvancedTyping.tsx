import { RotateCcw, Scan, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import type React from 'react';
import type { AiControls } from '../hooks/useAi';
import type { AdvancedTypingConfig, DetectedField } from '../types';
import { aiFillFields } from '../utils/ai';
import { cleanupPageScan, scanPageForTypingFields } from '../utils/injected-engine';
import { localFillFields } from '../utils/sample-data';
import FieldList from './FieldList';
import TimingOptions from './TimingOptions';

interface AdvancedTypingProps {
  config: AdvancedTypingConfig;
  updateConfig: (updates: Partial<AdvancedTypingConfig>) => void;
  fields: DetectedField[];
  onFieldsChange: (fields: DetectedField[]) => void;
  ai: AiControls;
  disabled: boolean;
  timingExpanded: boolean;
  onToggleTiming: (expanded: boolean) => void;
}

const AdvancedTyping: React.FC<AdvancedTypingProps> = ({
  config,
  updateConfig,
  fields,
  onFieldsChange,
  ai,
  disabled,
  timingExpanded,
  onToggleTiming,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);

  /**
   * Carry text and enabled state from the previous scan onto matching fields
   * in a fresh scan (match by selector first, then label + element type), so
   * "rescan and run the same thing again" never loses the user's input.
   */
  const mergePreviousFieldState = (
    previous: DetectedField[],
    next: DetectedField[]
  ): { merged: DetectedField[]; kept: number } => {
    const pool = previous.filter((field) => field.text.trim());
    const used = new Set<string>();
    let kept = 0;
    const merged = next.map((field) => {
      const match =
        pool.find(
          (candidate) =>
            !used.has(candidate.id) &&
            candidate.selector === field.selector &&
            candidate.elementType === field.elementType
        ) ??
        pool.find(
          (candidate) =>
            !used.has(candidate.id) &&
            candidate.label === field.label &&
            candidate.elementType === field.elementType
        );
      if (!match) return field;
      used.add(match.id);
      kept += 1;
      return { ...field, text: match.text, enabled: match.enabled };
    });
    return { merged, kept };
  };

  const handleScanPage = async () => {
    setIsScanning(true);
    setScanMessage('Scanning editable fields');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        setScanMessage('Unable to access the current tab.');
        return;
      }
      if (/^(chrome|edge|about|chrome-extension|moz-extension):/.test(tab.url ?? '')) {
        setScanMessage('This browser page cannot be scanned. Open a regular website.');
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scanPageForTypingFields,
      });
      const scan = results[0]?.result;
      if (!scan) {
        setScanMessage('The page did not return scan results.');
        return;
      }

      const { merged, kept } = mergePreviousFieldState(fields, scan.fields);
      onFieldsChange(merged);
      setScanMessage(
        merged.length === 0
          ? 'No supported editable fields were found.'
          : `Found ${merged.length} editable field${merged.length === 1 ? '' : 's'}.${
              kept > 0 ? ` Kept your text for ${kept}.` : ''
            }`
      );
      // Land keyboard users on the results.
      if (scan.fields.length > 0) listHeadingRef.current?.focus();
    } catch {
      setScanMessage('The page could not be scanned. Refresh it and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearScan = async () => {
    const scanToken = fields[0]?.scanToken;
    onFieldsChange([]);
    setScanMessage('Scan cleared');
    if (!scanToken) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: cleanupPageScan,
        args: [scanToken],
      });
    } catch {
      setScanMessage('The scan was cleared here, but the page is no longer available.');
    }
  };

  /**
   * Fill every enabled field with plausible sample values: on-device AI when
   * Gemini Nano is ready, the deterministic local generator otherwise (and as
   * silent fallback when AI fails). Only field metadata is ever sent to the
   * model — never page content.
   */
  const handleAutoFill = async () => {
    setIsFilling(true);
    setScanMessage('Filling fields with sample data');
    try {
      let filled: DetectedField[];
      let usedAi = false;
      if (ai.availability === 'available') {
        const session = await ai.ensureSession();
        if (session) {
          filled = await aiFillFields(session, fields);
          usedAi = true;
        } else {
          filled = localFillFields(fields);
        }
      } else {
        filled = localFillFields(fields);
      }
      onFieldsChange(filled);
      const count = fields.filter((field) => field.enabled).length;
      setScanMessage(
        `Filled ${count} field${count === 1 ? '' : 's'} with ${
          usedAi ? 'on-device AI' : 'built-in sample data'
        }.`
      );
    } finally {
      setIsFilling(false);
    }
  };

  const updateField = (id: string, updates: Partial<DetectedField>) => {
    onFieldsChange(fields.map((field) => (field.id === id ? { ...field, ...updates } : field)));
  };

  const reorderFields = (newFields: DetectedField[]) => {
    onFieldsChange(newFields.map((field, index) => ({ ...field, priority: index + 1 })));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Pinned scan bar */}
      <div className="shrink-0 px-4 pb-2 pt-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleScanPage}
            disabled={disabled || isScanning}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 font-semibold
                       transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 ${
                         fields.length > 0
                           ? 'border border-[var(--border)] bg-[var(--surface-raised)] py-2 text-sm text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5'
                           : 'bg-primary-500 py-2.5 text-white hover:bg-primary-600'
                       }`}
          >
            <Scan aria-hidden="true" className="h-4 w-4" />
            {isScanning ? 'Scanning...' : fields.length ? 'Rescan page' : 'Scan page'}
          </button>
          {fields.length > 0 && !disabled && (
            <button
              type="button"
              onClick={() => void handleAutoFill()}
              disabled={isFilling || isScanning}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border
                         border-[var(--border)] px-2.5 text-xs font-medium text-[var(--text-muted)]
                         hover:bg-black/5 hover:text-[var(--text)] disabled:cursor-not-allowed
                         disabled:opacity-50 dark:hover:bg-white/5"
              title={
                ai.availability === 'available'
                  ? 'Fill enabled fields using on-device AI'
                  : 'Fill enabled fields with built-in sample data'
              }
            >
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              {isFilling ? 'Filling…' : 'Auto-fill'}
            </button>
          )}
          {fields.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearScan}
              className="inline-flex items-center justify-center rounded-md border
                         border-[var(--border)] p-2 text-[var(--text-muted)]
                         hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
              aria-label="Clear detected fields and page highlights"
              title="Clear scan"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
        <p
          aria-live="polite"
          className="mt-1.5 min-h-4 text-center text-xs text-[var(--text-muted)]"
        >
          {scanMessage}
        </p>
      </div>

      {/* The one scroll region: the unbounded field list */}
      <div
        ref={scrollContainerRef}
        className="scroll-region min-h-0 flex-1 overflow-y-auto px-4 pb-2"
      >
        <FieldList
          fields={fields}
          onUpdateField={updateField}
          onReorderFields={reorderFields}
          disabled={disabled}
          scrollContainerRef={scrollContainerRef}
          headingRef={listHeadingRef}
        />
      </div>

      {/* Pinned timing accordion */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        <TimingOptions
          config={config}
          updateConfig={updateConfig}
          disabled={disabled}
          expanded={timingExpanded}
          onToggle={onToggleTiming}
        />
      </div>
    </div>
  );
};

export default AdvancedTyping;
