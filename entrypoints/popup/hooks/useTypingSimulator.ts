import { useState, useCallback, useRef } from 'react';
import type { TypingConfig, TypingState } from '../types';

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

  // Enhanced cleanup function with better error handling
  const stopTyping = useCallback(() => {
    return new Promise<void>((resolve) => {
      // Clear progress interval first
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Mark session as inactive immediately
      const wasActive = typingSessionRef.current.isActive;
      typingSessionRef.current.isActive = false;

      // Execute content script cleanup if we have an active tab
      const cleanupPromise = typingSessionRef.current.tabId 
        ? chrome.scripting.executeScript({
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
              return true; // Return success indicator
            },
          }).catch((error) => {
            console.warn('Cleanup script execution failed:', error);
            return false;
          })
        : Promise.resolve(true);

      cleanupPromise.finally(() => {
        // Reset all state - this is the key fix for button state
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

        resolve();
      });
    });
  }, []);

  // Enhanced progress monitoring with better cleanup
  const startProgressMonitoring = useCallback((textLength: number, tabId: number) => {
    // Clear any existing interval first
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    let fallbackProgress = 0;
    let consecutiveErrors = 0; // Track consecutive errors
    const maxConsecutiveErrors = 5;
    
    progressIntervalRef.current = setInterval(() => {
      // Double-check session is still active
      if (!typingSessionRef.current.isActive || typingSessionRef.current.tabId !== tabId) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        return;
      }

      // Try to get actual progress from content script
      chrome.scripting.executeScript({
        target: { tabId },
        func: () => (window as any).typingProgress || 0,
      }).then((results) => {
        consecutiveErrors = 0; // Reset error count on success
        
        if (results?.[0]?.result !== undefined) {
          const actualProgress = Math.min(Math.max(results[0].result, 0), 100);
          
          setTypingState(prev => ({ 
            ...prev, 
            progress: actualProgress,
            currentIndex: Math.floor((actualProgress / 100) * textLength)
          }));
          
          // Check for completion
          if (actualProgress >= 100) {
            setTimeout(() => {
              if (typingSessionRef.current.isActive) {
                stopTyping();
              }
            }, 500);
          }
        }
      }).catch((error) => {
        consecutiveErrors++;
        console.warn('Progress monitoring error:', error);
        
        // If too many consecutive errors, stop monitoring
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('Too many consecutive errors, stopping typing session');
          stopTyping();
          return;
        }
        
        // Fallback to estimated progress
        fallbackProgress = Math.min(fallbackProgress + (100 / Math.max(textLength * 2, 20)), 100);
        setTypingState(prev => ({ 
          ...prev, 
          progress: fallbackProgress,
          currentIndex: Math.floor((fallbackProgress / 100) * textLength)
        }));
        
        if (fallbackProgress >= 100) {
          setTimeout(() => {
            if (typingSessionRef.current.isActive) {
              stopTyping();
            }
          }, 500);
        }
      });
    }, 200); // Slightly increased interval for better stability
  }, [stopTyping]);

  const handleStartTyping = useCallback(async () => {
    if (!text.trim()) {
      alert('Please enter some text to simulate typing!');
      return;
    }

    // Validate minimum delay to prevent issues
    const effectiveDelay = Math.max(config.delay, 10); // Minimum 10ms
    const effectiveConfig = { ...config, delay: effectiveDelay };

    // Prevent multiple sessions - stop any existing session first
    if (typingSessionRef.current.isActive) {
      await stopTyping();
      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        alert('Unable to access the current tab');
        return;
      }

      // Check if tab is accessible
      if (tab.url?.startsWith('chrome://') || 
          tab.url?.startsWith('chrome-extension://') ||
          tab.url?.startsWith('edge://') ||
          tab.url?.startsWith('about:')) {
        alert('Cannot type on this page. Please navigate to a regular website.');
        return;
      }

      // Mark session as active before starting
      typingSessionRef.current.isActive = true;
      typingSessionRef.current.tabId = tab.id;

      // Set initial state - this ensures button state updates
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
        args: [{ 
          text, 
          ...effectiveConfig,
          onComplete: () => {
            // This callback is handled by progress monitoring
          }
        }],
      });

    } catch (error: any) {
      console.error('Error executing script:', error);
      let errorMessage = 'Failed to execute typing simulation.';
      
      if (error.message?.includes('Cannot access')) {
        errorMessage = 'Cannot access this page. Please try on a different website.';
      } else if (error.message?.includes('extensions gallery')) {
        errorMessage = 'Cannot type on extension pages. Please navigate to a regular website.';
      } else if (error.message?.includes('Refused to execute')) {
        errorMessage = 'This page blocks script execution. Please try a different website.';
      }
      
      alert(errorMessage);
      await stopTyping();
    }
  }, [text, config, stopTyping, startProgressMonitoring]);

  const handlePauseResume = useCallback(async () => {
    if (!typingSessionRef.current.isActive || !typingSessionRef.current.tabId) {
      return;
    }

    try {
      const isPaused = typingState.isPaused;
      
      await chrome.scripting.executeScript({
        target: { tabId: typingSessionRef.current.tabId },
        func: (shouldPause: boolean) => {
          if ((window as any).typingControl) {
            if (shouldPause) {
              (window as any).typingControl.pause();
            } else {
              (window as any).typingControl.resume();
            }
            return true;
          }
          return false;
        },
        args: [!isPaused],
      });

      // Update state immediately for responsive UI
      setTypingState(prev => ({ ...prev, isPaused: !isPaused }));

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
      await stopTyping();
    }
  }, [typingState.isPaused, text.length, startProgressMonitoring, stopTyping]);

  const handleStop = useCallback(async () => {
    await stopTyping();
  }, [stopTyping]);

  return {
    typingState,
    handleStartTyping,
    handlePauseResume,
    handleStop,
  };
};

// Enhanced content script function with comprehensive bug fixes
function simulateTypingWithFeatures(config: TypingConfig & { 
  text: string; 
  onComplete?: () => void;
}) {
  const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement;

  // Enhanced validation
  if (!el || !['INPUT', 'TEXTAREA'].includes(el.tagName)) {
    alert('Please click inside a text input field first.');
    return;
  }

  // Check if element is editable
  if (el.hasAttribute('readonly') || el.hasAttribute('disabled')) {
    alert('This text field is not editable.');
    return;
  }

  // Clear existing content and any previous typing controls
  el.value = '';
  el.focus();

  // Clean up any existing typing session with better cleanup
  if ((window as any).typingControl) {
    try {
      (window as any).typingControl.stop();
    } catch (e) {
      console.warn('Error stopping previous typing session:', e);
    }
    delete (window as any).typingControl;
  }

  // Clean up previous progress tracking
  if ((window as any).typingProgress !== undefined) {
    delete (window as any).typingProgress;
  }

  // Initialize progress tracking
  (window as any).typingProgress = 0;

  // Session control variables
  let isPaused = false;
  let isStopped = false;
  let currentIndex = 0;
  let timeoutIds: number[] = [];
  let audioContext: AudioContext | null = null;
  let mistakeCount = 0;
  
  const { text, delay, includeMistakes, soundEnabled, typingStyle } = config;
  const maxMistakes = Math.max(1, Math.floor(text.length * 0.05)); // Max 5% mistakes

  // Enhanced cleanup function
  function cleanup() {
    isStopped = true;
    
    // Clear all timeouts with better error handling
    timeoutIds.forEach(id => {
      try {
        clearTimeout(id);
      } catch (e) {
        console.warn('Error clearing timeout:', e);
      }
    });
    timeoutIds = [];
    
    // Clean up audio context properly
    if (audioContext) {
      try {
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(e => console.warn('Error closing audio context:', e));
        }
      } catch (e) {
        console.warn('Error handling audio context:', e);
      }
      audioContext = null;
    }
    
    // Remove typing control and progress from window
    try {
      delete (window as any).typingControl;
      delete (window as any).typingProgress;
    } catch (e) {
      console.warn('Error cleaning up window properties:', e);
    }
  }

  // Initialize audio context with better error handling
  function initAudioContext() {
    if (!soundEnabled || audioContext) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
      audioContext = null;
    }
  }

  // Optimized sound generation with better error handling
  function playKeySound() {
    if (!audioContext || isStopped || !soundEnabled) return;
    
    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {}); // Try to resume if suspended
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Vary the frequency slightly for more realistic sound
      oscillator.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.03, audioContext.currentTime); // Reduced volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.06);
    } catch (error) {
      // Silently handle audio errors but log for debugging
      console.debug('Audio playback error:', error);
    }
  }

  // Improved mistake simulation with limits
  function shouldMakeMistake(): boolean {
    return includeMistakes && 
           mistakeCount < maxMistakes && 
           Math.random() < 0.025 && // Reduced to 2.5% chance
           el.value.length > 0 &&
           currentIndex > 0; // Don't make mistakes on first character
  }

  // Helper functions for consistent event triggering
  function triggerInputEvents(char: string) {
    try {
      el.dispatchEvent(new KeyboardEvent('keydown', { 
        key: char, bubbles: true, cancelable: true 
      }));
      
      el.dispatchEvent(new KeyboardEvent('keypress', { 
        key: char, bubbles: true, cancelable: true 
      }));
      
      el.dispatchEvent(new InputEvent('input', { 
        bubbles: true, cancelable: true,
        data: char, inputType: 'insertText'
      }));
      
      el.dispatchEvent(new KeyboardEvent('keyup', { 
        key: char, bubbles: true, cancelable: true 
      }));
    } catch (error) {
      console.warn('Error triggering input events:', error);
    }
  }

  function triggerBackspaceEvents() {
    try {
      el.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Backspace', code: 'Backspace',
        bubbles: true, cancelable: true 
      }));
      
      el.dispatchEvent(new InputEvent('input', { 
        bubbles: true, cancelable: true,
        inputType: 'deleteContentBackward'
      }));
      
      el.dispatchEvent(new KeyboardEvent('keyup', { 
        key: 'Backspace', code: 'Backspace',
        bubbles: true, cancelable: true 
      }));
    } catch (error) {
      console.warn('Error triggering backspace events:', error);
    }
  }

  function simulateBackspace() {
    if (isStopped || el.value.length === 0) return;
    
    el.value = el.value.slice(0, -1);
    triggerBackspaceEvents();
    playKeySound();
  }

  // Get delay based on typing style with minimum enforcement
  function getTypingDelay(): number {
    const baseDelay = Math.max(delay, 15); // Increased minimum to 15ms for stability
    
    switch (typingStyle) {
      case 'random':
        return Math.random() * (baseDelay * 1.8) + (baseDelay * 0.6);
      case 'word-by-word':
        return baseDelay;
      case 'normal':
      default:
        return baseDelay + (Math.random() * baseDelay * 0.3); // Add slight variation
    }
  }

  // Safe setTimeout wrapper with better tracking
  function safeSetTimeout(callback: () => void, delayMs: number): void {
    if (isStopped) return;
    
    const actualDelay = Math.max(delayMs, 15); // Enforce minimum delay
    const timeoutId = window.setTimeout(() => {
      // Remove this timeout ID from tracking array
      const index = timeoutIds.indexOf(timeoutId);
      if (index > -1) {
        timeoutIds.splice(index, 1);
      }
      
      if (!isStopped) {
        try {
          callback();
        } catch (error) {
          console.error('Error in timeout callback:', error);
          cleanup(); // Cleanup on error
        }
      }
    }, actualDelay);
    
    timeoutIds.push(timeoutId);
  }

  // Improved word-by-word typing logic
  function typeWordByWord(words: string[], wordIndex: number) {
    if (isStopped) return;
    
    if (isPaused) {
      safeSetTimeout(() => typeWordByWord(words, wordIndex), 100);
      return;
    }

    // Update progress more accurately
    const totalWords = words.length;
    (window as any).typingProgress = Math.min((wordIndex / totalWords) * 100, 100);

    if (wordIndex >= totalWords) {
      (window as any).typingProgress = 100;
      try {
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {
        console.warn('Error dispatching change event:', e);
      }
      config.onComplete?.();
      cleanup();
      return;
    }

    const word = words[wordIndex];
    const isLastWord = wordIndex === totalWords - 1;
    const textToAdd = isLastWord ? word : word + ' ';

    el.value += textToAdd;
    triggerInputEvents(textToAdd);
    playKeySound();

    safeSetTimeout(() => typeWordByWord(words, wordIndex + 1), getTypingDelay() * 2.5);
  }

  // Enhanced character-by-character typing logic
  function typeChar(index: number) {
    if (isStopped) return;
    
    if (isPaused) {
      safeSetTimeout(() => typeChar(index), 100);
      return;
    }

    // Update progress and current index
    currentIndex = index;
    (window as any).typingProgress = Math.min((index / text.length) * 100, 100);

    if (index >= text.length) {
      (window as any).typingProgress = 100;
      try {
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (e) {
        console.warn('Error dispatching change event:', e);
      }
      config.onComplete?.();
      cleanup();
      return;
    }

    const char = text[index];

    // Check for mistakes with improved logic
    if (shouldMakeMistake()) {
      mistakeCount++;
      
      // Generate a more realistic wrong character
      const qwertyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
      const currentChar = char.toLowerCase();
      const currentRow = qwertyRows.find(row => row.includes(currentChar));
      const randomRow = currentRow || qwertyRows[Math.floor(Math.random() * qwertyRows.length)];
      const wrongChar = randomRow[Math.floor(Math.random() * randomRow.length)];
      
      // Type wrong character
      el.value += wrongChar;
      triggerInputEvents(wrongChar);
      playKeySound();

      // Backspace after a realistic delay
      safeSetTimeout(() => {
        if (!isStopped && el.value.length > 0) {
          simulateBackspace();
          
          // Continue with correct character after another delay
          safeSetTimeout(() => typeChar(index), getTypingDelay() * 0.8);
        }
      }, getTypingDelay() * 1.2);
      
      return;
    }

    // Type correct character
    el.value += char;
    triggerInputEvents(char);
    playKeySound();

    safeSetTimeout(() => typeChar(index + 1), getTypingDelay());
  }

  // Initialize audio if needed
  initAudioContext();

  // Expose pause/resume/stop controls with proper cleanup
  (window as any).typingControl = {
    pause: () => { 
      isPaused = true; 
    },
    resume: () => { 
      isPaused = false; 
    },
    stop: cleanup
  };

  // Start typing based on style
  try {
    if (typingStyle === 'word-by-word') {
      const words = text.split(/\s+/).filter(word => word.length > 0);
      if (words.length === 0) {
        alert('No valid words found in the text.');
        cleanup();
        return;
      }
      typeWordByWord(words, 0);
    } else {
      typeChar(0);
    }
  } catch (error) {
    console.error('Error starting typing simulation:', error);
    cleanup();
  }
}