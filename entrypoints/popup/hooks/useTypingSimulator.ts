import { useCallback, useRef, useState } from 'react';
import type { TypingConfig, TypingState } from '../types';
import { analytics, getTypingMode } from '../utils/analytics';

export const useTypingSimulator = (text: string, config: TypingConfig) => {
  const [typingState, setTypingState] = useState<TypingState>({
    isTyping: false,
    isPaused: false,
    progress: 0,
    currentIndex: 0,
  });

  // Use ref to track typing session and prevent multiple sessions
  const typingSessionRef = useRef<{
    isActive: boolean;
    tabId: number | null;
    cleanup: () => void;
  }>({
    isActive: false,
    tabId: null,
    cleanup: () => {},
  });

  // Progress update interval ref
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to stop all typing activities
  const stopTyping = useCallback(() => {
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Mark session as inactive
    typingSessionRef.current.isActive = false;

    // Execute content script cleanup if we have an active tab
    if (typingSessionRef.current.tabId) {
      try {
        chrome.scripting
          .executeScript({
            target: { tabId: typingSessionRef.current.tabId },
            func: () => {
              // Stop typing in content script
              if ((window as any).typingControl) {
                (window as any).typingControl.stop();
                delete (window as any).typingControl;
              }
              // Clean up progress tracking
              if ((window as any).typingProgress !== undefined) {
                delete (window as any).typingProgress;
              }
            },
          })
          .catch(() => {
            // Ignore errors if tab is closed or script injection fails
          });
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    // Reset all state
    setTypingState({
      isTyping: false,
      isPaused: false,
      progress: 0,
      currentIndex: 0,
    });

    // Reset session ref
    typingSessionRef.current = {
      isActive: false,
      tabId: null,
      cleanup: () => {},
    };
  }, []);

  // Enhanced progress monitoring that gets actual progress from content script
  const startProgressMonitoring = useCallback(
    (textLength: number, tabId: number) => {
      let fallbackProgress = 0;

      progressIntervalRef.current = setInterval(() => {
        if (!typingSessionRef.current.isActive) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return;
        }

        // Try to get actual progress from content script
        chrome.scripting
          .executeScript({
            target: { tabId },
            func: () => (window as any).typingProgress || 0,
          })
          .then((results) => {
            if (results?.[0]?.result !== undefined) {
              const actualProgress = Math.min(Math.max(results[0].result, 0), 100);
              setTypingState((prev) => ({
                ...prev,
                progress: actualProgress,
                currentIndex: Math.floor((actualProgress / 100) * textLength),
              }));

              if (actualProgress >= 100) {
                setTimeout(async () => {
                  if (typingSessionRef.current.isActive) {
                    // Track completion
                    const typingMode = getTypingMode(1);
                    await analytics.trackTypingCompleted(1, typingMode, textLength, true);
                    await analytics.trackTypingStopped('completed', 'basic_typing');
                    stopTyping();
                  }
                }, 500);
              }
            }
          })
          .catch(() => {
            // Fallback to estimated progress if script execution fails
            fallbackProgress = Math.min(fallbackProgress + 100 / Math.max(textLength, 1), 100);
            setTypingState((prev) => ({
              ...prev,
              progress: fallbackProgress,
              currentIndex: Math.floor((fallbackProgress / 100) * textLength),
            }));

            if (fallbackProgress >= 100) {
              setTimeout(() => {
                if (typingSessionRef.current.isActive) {
                  stopTyping();
                }
              }, 500);
            }
          });
      }, 150); // Reduced frequency for better performance
    },
    [stopTyping]
  );

  const handleStartTyping = useCallback(async () => {
    if (!text.trim()) {
      alert('Please enter some text to simulate typing!');
      return;
    }

    // Track typing started
    const typingMode = getTypingMode(1); // Basic typing is always single field
    await analytics.trackTypingStarted(1, typingMode, text.length);

    // Validate minimum delay to prevent issues
    const effectiveDelay = Math.max(config.delay, 10); // Minimum 10ms
    const effectiveConfig = { ...config, delay: effectiveDelay };

    // Prevent multiple sessions - stop any existing session first
    if (typingSessionRef.current.isActive) {
      stopTyping();
      // Wait a bit for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        alert('Unable to access the current tab');
        return;
      }

      // Check if tab is accessible (not chrome:// or extension pages)
      if (
        tab.url?.startsWith('chrome://') ||
        tab.url?.startsWith('chrome-extension://') ||
        tab.url?.startsWith('moz-extension://')
      ) {
        alert('Cannot type on this page. Please navigate to a regular website.');
        return;
      }

      // Mark session as active before starting
      typingSessionRef.current.isActive = true;
      typingSessionRef.current.tabId = tab.id;

      setTypingState({
        isTyping: true,
        isPaused: false,
        currentIndex: 0,
        progress: 0,
      });

      // Start progress monitoring
      startProgressMonitoring(text.length, tab.id);

      // Execute typing script with enhanced error handling
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: simulateTypingWithFeatures,
        args: [
          {
            text,
            ...effectiveConfig,
          },
        ],
      });
    } catch (error: any) {
      console.error('Error executing script:', error);
      let errorMessage = 'Failed to execute typing simulation.';

      if (error.message?.includes('Cannot access')) {
        errorMessage = 'Cannot access this page. Please try on a different website.';
      } else if (error.message?.includes('The extensions gallery')) {
        errorMessage = 'Cannot type on extension pages. Please navigate to a regular website.';
      } else if (error.message?.includes('Unexpected token')) {
        errorMessage = 'Script injection failed. Please refresh the page and try again.';
      }

      alert(errorMessage);

      // Track error
      const typingMode = getTypingMode(1);
      await analytics.trackTypingCompleted(1, typingMode, text.length, false);
      await analytics.trackTypingStopped('error', 'basic_typing');

      stopTyping();
    }
  }, [text, config, stopTyping, startProgressMonitoring]);

  const handlePauseResume = useCallback(async () => {
    if (!typingSessionRef.current.isActive || !typingSessionRef.current.tabId) {
      return;
    }

    try {
      const isPaused = typingState.isPaused;
      const action = isPaused ? 'resumed' : 'paused';

      // Track pause/resume action
      await analytics.trackTypingPauseResume(action, 'basic_typing');

      await chrome.scripting.executeScript({
        target: { tabId: typingSessionRef.current.tabId },
        func: (shouldPause: boolean) => {
          if ((window as any).typingControl) {
            if (shouldPause) {
              (window as any).typingControl.pause();
            } else {
              (window as any).typingControl.resume();
            }
          }
        },
        args: [!isPaused],
      });

      setTypingState((prev) => ({ ...prev, isPaused: !isPaused }));

      // Handle progress monitoring pause/resume
      if (!isPaused) {
        // Pausing - clear interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      } else {
        // Resuming - restart progress monitoring
        if (typingSessionRef.current.tabId) {
          startProgressMonitoring(text.length, typingSessionRef.current.tabId);
        }
      }
    } catch (error) {
      console.error('Error controlling typing:', error);
      // If we can't control the typing, stop it entirely
      await analytics.trackTypingStopped('error', 'basic_typing');
      stopTyping();
    }
  }, [typingState.isPaused, text.length, startProgressMonitoring, stopTyping]);

  const handleStop = useCallback(async () => {
    await analytics.trackTypingStopped('manual', 'basic_typing');
    stopTyping();
  }, [stopTyping]);

  return {
    typingState,
    handleStartTyping,
    handlePauseResume,
    handleStop,
  };
};

// Enhanced content script function with modular imports and bug fixes
function simulateTypingWithFeatures(config: TypingConfig & { text: string }) {
  // Audio management utilities
  const createAudioUtils = () => {
    let audioContext: AudioContext | null = null;

    return {
      initAudioContext: (enabled: boolean) => {
        if (!enabled || audioContext) return;
        try {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (error) {
          console.warn('Audio context not available:', error);
        }
      },
      playKeySound: (enabled: boolean) => {
        if (!audioContext || !enabled) return;
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime);
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.08);
        } catch (error) {
          // Silently handle audio errors
        }
      },
      cleanupAudio: () => {
        if (audioContext) {
          audioContext.close().catch(() => {});
          audioContext = null;
        }
      },
    };
  };

  // Control utilities
  const createControlUtils = () => {
    let timeoutIds: number[] = [];

    return {
      validateInputElement: (
        element: Element | null
      ): HTMLInputElement | HTMLTextAreaElement | null => {
        if (!element || !['INPUT', 'TEXTAREA'].includes(element.tagName)) return null;
        const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
        if (inputElement.hasAttribute('readonly') || inputElement.hasAttribute('disabled'))
          return null;
        return inputElement;
      },
      safeSetTimeout: (callback: () => void, delay: number) => {
        const timeoutId = window.setTimeout(
          () => {
            const index = timeoutIds.indexOf(timeoutId);
            if (index > -1) timeoutIds.splice(index, 1);
            callback();
          },
          Math.max(delay, 10)
        );
        timeoutIds.push(timeoutId);
      },
      clearAllTimeouts: () => {
        timeoutIds.forEach((id) => clearTimeout(id));
        timeoutIds = [];
      },
      getTypingDelay: (baseDelay: number, typingStyle: string) => {
        const safeDelay = Math.max(baseDelay, 10);
        switch (typingStyle) {
          case 'random':
            return Math.random() * (safeDelay * 2) + safeDelay * 0.5;
          case 'word-by-word':
            return safeDelay;
          default:
            return safeDelay;
        }
      },
    };
  };

  // Event utilities
  const createEventUtils = () => ({
    triggerInputEvents: (element: HTMLInputElement | HTMLTextAreaElement, char: string) => {
      element.dispatchEvent(
        new KeyboardEvent('keydown', { key: char, bubbles: true, cancelable: true })
      );
      element.dispatchEvent(
        new KeyboardEvent('keypress', { key: char, bubbles: true, cancelable: true })
      );
      element.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          data: char,
          inputType: 'insertText',
        })
      );
      element.dispatchEvent(
        new KeyboardEvent('keyup', { key: char, bubbles: true, cancelable: true })
      );
    },
    triggerBackspaceEvents: (element: HTMLInputElement | HTMLTextAreaElement) => {
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Backspace',
          code: 'Backspace',
          bubbles: true,
          cancelable: true,
        })
      );
      element.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'deleteContentBackward',
        })
      );
      element.dispatchEvent(
        new KeyboardEvent('keyup', {
          key: 'Backspace',
          code: 'Backspace',
          bubbles: true,
          cancelable: true,
        })
      );
    },
    triggerChangeEvent: (element: HTMLInputElement | HTMLTextAreaElement) => {
      element.dispatchEvent(new Event('change', { bubbles: true }));
    },
  });

  // Mistake utilities
  const createMistakeUtils = () => ({
    shouldMakeMistake: (
      includeMistakes: boolean,
      mistakeCount: number,
      maxMistakes: number,
      currentLength: number
    ) => {
      return (
        includeMistakes && mistakeCount < maxMistakes && Math.random() < 0.03 && currentLength > 0
      );
    },
    generateWrongCharacter: () => {
      const qwertyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
      const randomRow = qwertyRows[Math.floor(Math.random() * qwertyRows.length)];
      return randomRow[Math.floor(Math.random() * randomRow.length)];
    },
    calculateMaxMistakes: (textLength: number) => {
      return Math.max(1, Math.floor(textLength * 0.05));
    },
  });

  // Initialize utilities
  const audioUtils = createAudioUtils();
  const controlUtils = createControlUtils();
  const eventUtils = createEventUtils();
  const mistakeUtils = createMistakeUtils();

  const el: any = controlUtils.validateInputElement(document.activeElement);

  if (!el) {
    alert('Please click inside a text input field first.');
    return;
  }

  // Clear existing content and any previous typing controls
  el.value = '';
  el.focus();

  // Clean up any existing typing session
  if ((window as any).typingControl) {
    (window as any).typingControl.stop();
    delete (window as any).typingControl;
  }

  // Initialize progress tracking
  (window as any).typingProgress = 0;

  // Session control variables
  let isPaused = false;
  let isStopped = false;
  let mistakeCount = 0;

  const { text, delay, includeMistakes, soundEnabled, typingStyle } = config;
  const maxMistakes = mistakeUtils.calculateMaxMistakes(text.length);

  // Initialize audio
  audioUtils.initAudioContext(soundEnabled);

  // Cleanup function
  function cleanup() {
    isStopped = true;
    controlUtils.clearAllTimeouts();
    audioUtils.cleanupAudio();
    delete (window as any).typingControl;
    if ((window as any).typingProgress !== undefined) {
      (window as any).typingProgress = 100; // Ensure final progress update
    }
  }

  // Expose controls
  (window as any).typingControl = {
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
    stop: cleanup,
  };

  // Character typing function
  function typeChar(index: number) {
    if (isStopped) return;

    if (isPaused) {
      controlUtils.safeSetTimeout(() => typeChar(index), 100);
      return;
    }

    // Update progress with bounds checking
    (window as any).typingProgress = Math.min((index / text.length) * 100, 100);

    if (index >= text.length) {
      (window as any).typingProgress = 100;
      eventUtils.triggerChangeEvent(el);
      cleanup();
      return;
    }

    const char = text[index];

    // Mistake simulation
    if (
      mistakeUtils.shouldMakeMistake(includeMistakes, mistakeCount, maxMistakes, el.value.length)
    ) {
      mistakeCount++;
      const wrongChar = mistakeUtils.generateWrongCharacter();

      el.value += wrongChar;
      eventUtils.triggerInputEvents(el, wrongChar);
      audioUtils.playKeySound(soundEnabled);

      controlUtils.safeSetTimeout(() => {
        if (!isStopped && el.value.length > 0) {
          el.value = el.value.slice(0, -1);
          eventUtils.triggerBackspaceEvents(el);
          audioUtils.playKeySound(soundEnabled);
          controlUtils.safeSetTimeout(
            () => typeChar(index),
            controlUtils.getTypingDelay(delay, typingStyle)
          );
        }
      }, controlUtils.getTypingDelay(delay, typingStyle) * 1.5);
      return;
    }

    el.value += char;
    eventUtils.triggerInputEvents(el, char);
    audioUtils.playKeySound(soundEnabled);

    controlUtils.safeSetTimeout(
      () => typeChar(index + 1),
      controlUtils.getTypingDelay(delay, typingStyle)
    );
  }

  // Word-by-word typing function
  function typeWordByWord(words: string[], wordIndex: number) {
    if (isStopped) return;

    if (isPaused) {
      controlUtils.safeSetTimeout(() => typeWordByWord(words, wordIndex), 100);
      return;
    }

    // Update progress with bounds checking
    (window as any).typingProgress = Math.min((wordIndex / words.length) * 100, 100);

    if (wordIndex >= words.length) {
      (window as any).typingProgress = 100;
      eventUtils.triggerChangeEvent(el);
      cleanup();
      return;
    }

    const word = words[wordIndex];
    const isLastWord = wordIndex === words.length - 1;
    const textToAdd = isLastWord ? word : word + ' ';

    el.value += textToAdd;
    eventUtils.triggerInputEvents(el, textToAdd);
    audioUtils.playKeySound(soundEnabled);

    controlUtils.safeSetTimeout(
      () => typeWordByWord(words, wordIndex + 1),
      controlUtils.getTypingDelay(delay, typingStyle) * 3
    );
  }

  // Start typing based on style
  if (typingStyle === 'word-by-word') {
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) {
      alert('No valid words found in the text.');
      cleanup();
      return;
    }
    typeWordByWord(words, 0);
  } else {
    typeChar(0);
  }
}
