import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AdvancedTypingConfig,
  DetectedField,
  TypingConfig,
  TypingSessionStatus,
} from '../types';
import {
  type PageTypingRequest,
  controlPageTyping,
  getPageTypingStatus,
  startPageTyping,
} from '../utils/injected-engine';
import {
  getTabCapabilityError,
  idleTypingStatus,
  isTypingStatusActive,
} from '../utils/session-status';

export const useTypingSession = () => {
  const [status, setStatus] = useState<TypingSessionStatus>(idleTypingStatus);
  const [error, setError] = useState('');
  const tabIdRef = useRef<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActive = isTypingStatusActive(status);

  const updateStatus = useCallback((nextStatus: TypingSessionStatus) => {
    setStatus({ ...nextStatus });
  }, []);

  const getActiveTab = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabError = getTabCapabilityError(tab);
    if (tabError) {
      setError(tabError);
      return null;
    }
    tabIdRef.current = tab.id ?? null;
    return tab.id ?? null;
  }, []);

  const readStatus = useCallback(
    async (tabId: number) => {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: getPageTypingStatus,
        });
        const nextStatus = results[0]?.result;
        if (nextStatus) updateStatus(nextStatus);
      } catch {
        updateStatus(idleTypingStatus);
        setError(
          'The page is no longer available. Refresh or open a regular website and try again.'
        );
      }
    },
    [updateStatus]
  );

  useEffect(() => {
    let disposed = false;

    const restore = async () => {
      const tabId = await getActiveTab();
      if (!disposed && tabId) await readStatus(tabId);
    };

    void restore();
    return () => {
      disposed = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [getActiveTab, readStatus]);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!isActive || !tabIdRef.current) return;
    pollRef.current = setInterval(() => {
      if (tabIdRef.current) void readStatus(tabIdRef.current);
    }, 250);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isActive, readStatus]);

  const start = useCallback(
    async (request: PageTypingRequest) => {
      setError('');
      const tabId = await getActiveTab();
      if (!tabId) return false;

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: startPageTyping,
          args: [request],
        });
        const result = results[0]?.result;
        if (!result?.ok) {
          const message = result?.status.message ?? 'Unable to start typing on this page.';
          setError(message);
          if (result?.status) updateStatus(result.status);
          return false;
        }
        updateStatus(result.status);
        return true;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : '';
        setError(
          message.includes('Cannot access')
            ? 'This page does not allow extension typing.'
            : 'The typing session could not be started. Refresh the page and try again.'
        );
        updateStatus(idleTypingStatus);
        return false;
      }
    },
    [getActiveTab, updateStatus]
  );

  const startBasic = useCallback(
    (text: string, typingConfig: TypingConfig) => start({ mode: 'basic', text, typingConfig }),
    [start]
  );

  const startAdvanced = useCallback(
    (fields: DetectedField[], typingConfig: TypingConfig, advancedConfig: AdvancedTypingConfig) =>
      start({ mode: 'advanced', fields, typingConfig, advancedConfig }),
    [start]
  );

  const control = useCallback(
    async (action: 'pause' | 'resume' | 'stop') => {
      const tabId = tabIdRef.current ?? (await getActiveTab());
      if (!tabId) return;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: controlPageTyping,
          args: [action],
        });
        const nextStatus = results[0]?.result;
        if (nextStatus) updateStatus(nextStatus);
      } catch {
        setError('The active page is no longer available.');
        updateStatus(idleTypingStatus);
      }
    },
    [getActiveTab, updateStatus]
  );

  return {
    status,
    error,
    clearError: () => setError(''),
    isActive,
    startBasic,
    startAdvanced,
    pause: () => control('pause'),
    resume: () => control('resume'),
    stop: () => control('stop'),
  };
};
