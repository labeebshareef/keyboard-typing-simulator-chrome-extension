import { Clock, Keyboard, Play, Settings, Zap } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';

interface TypingState {
  isTyping: boolean;
  progress: number;
}

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [delay, setDelay] = useState(50);
  const [typingState, setTypingState] = useState<TypingState>({
    isTyping: false,
    progress: 0,
  });

  const handleStartTyping = useCallback(async () => {
    if (!text.trim()) {
      alert('Please enter some text to simulate typing!');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        alert('Unable to access the current tab');
        return;
      }

      setTypingState({ isTyping: true, progress: 0 });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: simulateTyping,
        args: [text, delay],
      });
    } catch (error) {
      console.error('Error executing script:', error);
      alert('Failed to execute typing simulation. Please try again.');
    } finally {
      setTypingState({ isTyping: false, progress: 0 });
    }
  }, [text, delay]);

  const getDelayLabel = (delayValue: number): string => {
    if (delayValue <= 20) return 'Lightning Fast';
    if (delayValue <= 50) return 'Fast';
    if (delayValue <= 100) return 'Normal';
    if (delayValue <= 200) return 'Slow';
    return 'Very Slow';
  };

  const getDelayColor = (delayValue: number): string => {
    if (delayValue <= 20) return 'text-red-500';
    if (delayValue <= 50) return 'text-orange-500';
    if (delayValue <= 100) return 'text-green-500';
    if (delayValue <= 200) return 'text-blue-500';
    return 'text-purple-500';
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 animate-fade-in">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Keyboard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Type Simulator</h1>
          </div>
          <p className="text-sm text-gray-600">
            Simulate realistic typing with adjustable speed controls
          </p>
        </div>

        {/* Text Input */}
        <div className="space-y-3">
          <label htmlFor="text-input" className="block text-sm font-semibold text-gray-700">
            Text to Type
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to simulate typing..."
            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl resize-none 
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-all duration-200 text-sm leading-relaxed
                     placeholder-gray-400 bg-white shadow-sm"
            disabled={typingState.isTyping}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{text.length} characters</span>
            <span>{text.split(' ').filter((word) => word.length > 0).length} words</span>
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">Typing Speed</label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${getDelayColor(delay)}`}>
                {getDelayLabel(delay)}
              </span>
              <span className="text-xs text-gray-500">{delay}ms delay</span>
            </div>

            <div className="relative">
              <input
                type="range"
                min="1"
                max="300"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                         slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4
                         slider-thumb:rounded-full slider-thumb:bg-primary-500
                         slider-thumb:cursor-pointer slider-thumb:shadow-lg"
                disabled={typingState.isTyping}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Fastest</span>
                <span>Slowest</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStartTyping}
          disabled={typingState.isTyping || !text.trim()}
          className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   text-white font-semibold rounded-xl transition-all duration-200
                   transform hover:scale-[1.02] active:scale-[0.98]
                   shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          {typingState.isTyping ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Typing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start Typing</span>
            </>
          )}
        </button>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Instructions</span>
          </div>
          <ol className="text-xs text-amber-700 space-y-1 ml-6 list-decimal">
            <li>Click on any text input field on the webpage</li>
            <li>Enter your desired text above</li>
            <li>Adjust the typing speed to your preference</li>
            <li>Click "Start Typing" to begin simulation</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">v2.0 • Perfect for testing forms and demos</p>
        </div>
      </div>
    </div>
  );
};

// Content script function that will be injected
function simulateTyping(text: string, delay: number) {
  const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement;

  if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) {
    alert('Please click inside a text input field first.');
    return;
  }

  // Clear existing content
  el.value = '';
  el.focus();

  function typeChar(index: number) {
    if (index < text.length) {
      const char = text[index];

      // Simulate realistic keyboard events
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: char,
          bubbles: true,
          cancelable: true,
        })
      );

      el.dispatchEvent(
        new KeyboardEvent('keypress', {
          key: char,
          bubbles: true,
          cancelable: true,
        })
      );

      // Update the value
      el.value += char;

      // Trigger input and change events
      el.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          data: char,
          inputType: 'insertText',
        })
      );

      el.dispatchEvent(
        new KeyboardEvent('keyup', {
          key: char,
          bubbles: true,
          cancelable: true,
        })
      );

      // Continue typing
      setTimeout(() => typeChar(index + 1), delay);
    } else {
      // Trigger final change event when done
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  typeChar(0);
}

export default App;
