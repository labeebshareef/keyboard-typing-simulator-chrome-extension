import { Pause, Play, RotateCcw, Scan, Square } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';
import type {
  AdvancedTypingConfig,
  DetectedField,
  TypingConfig,
  TypingSessionStatus,
} from '../types';
import { cleanupPageScan, scanPageForTypingFields } from '../utils/injected-engine';
import FieldList from './FieldList';
import ProgressDisplay from './ProgressDisplay';

interface AdvancedTypingProps {
  config: AdvancedTypingConfig;
  typingConfig: TypingConfig;
  disabled: boolean;
  session: {
    status: TypingSessionStatus;
    isActive: boolean;
    startAdvanced: (
      fields: DetectedField[],
      typingConfig: TypingConfig,
      advancedConfig: AdvancedTypingConfig
    ) => Promise<boolean>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
  };
}

const AdvancedTyping: React.FC<AdvancedTypingProps> = ({
  config,
  typingConfig,
  disabled,
  session,
}) => {
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

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

      setDetectedFields(scan.fields);
      setScanMessage(
        scan.fields.length === 0
          ? 'No supported editable fields were found.'
          : `Found ${scan.fields.length} editable field${scan.fields.length === 1 ? '' : 's'}.`
      );
    } catch {
      setScanMessage('The page could not be scanned. Refresh it and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearScan = async () => {
    const scanToken = detectedFields[0]?.scanToken;
    setDetectedFields([]);
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

  const handleStartTyping = async () => {
    const fields = detectedFields
      .filter((field) => field.enabled && field.text.trim())
      .sort((left, right) => left.priority - right.priority);
    if (fields.length === 0) {
      setScanMessage('Enable at least one field and add text before starting.');
      return;
    }

    const started = await session.startAdvanced(fields, typingConfig, config);
    if (started && config.hideExtension) window.close();
  };

  const updateField = (id: string, updates: Partial<DetectedField>) => {
    setDetectedFields((fields) =>
      fields.map((field) => (field.id === id ? { ...field, ...updates } : field))
    );
  };

  const reorderFields = (newFields: DetectedField[]) => {
    setDetectedFields(newFields.map((field, index) => ({ ...field, priority: index + 1 })));
  };

  const isPaused = session.status.phase === 'paused';

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleScanPage}
          disabled={disabled || isScanning}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Scan aria-hidden="true" className="h-4 w-4" />
          {isScanning ? 'Scanning...' : detectedFields.length ? 'Scan again' : 'Scan page'}
        </button>
        {detectedFields.length > 0 && !session.isActive && (
          <button
            type="button"
            onClick={handleClearScan}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 p-2.5 text-gray-700 hover:bg-gray-50"
            aria-label="Clear detected fields and page highlights"
            title="Clear scan"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      <p aria-live="polite" className="min-h-5 text-center text-xs text-gray-600">
        {scanMessage}
      </p>

      {detectedFields.length > 0 && (
        <FieldList
          fields={detectedFields}
          onUpdateField={updateField}
          onReorderFields={reorderFields}
          disabled={session.isActive}
        />
      )}

      {session.isActive && session.status.mode === 'advanced' ? (
        <div className="space-y-3">
          <ProgressDisplay progress={session.status.progress} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={isPaused ? session.resume : session.pause}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
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
              className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700"
            >
              <Square aria-hidden="true" className="h-4 w-4" />
              Stop
            </button>
          </div>
        </div>
      ) : (
        detectedFields.length > 0 && (
          <button
            type="button"
            onClick={handleStartTyping}
            disabled={
              disabled || detectedFields.every((field) => !field.enabled || !field.text.trim())
            }
            className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Play aria-hidden="true" className="h-4 w-4" />
            Start typing
          </button>
        )
      )}
    </div>
  );
};

export default AdvancedTyping;
