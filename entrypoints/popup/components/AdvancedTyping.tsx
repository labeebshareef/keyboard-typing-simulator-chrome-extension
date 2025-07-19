import { useState } from 'react';
import { Scan, Play, Settings, Clock, EyeOff, Timer } from 'lucide-react';
import type React from 'react';
import type { AdvancedTypingConfig, DetectedField, TypingConfig } from '../types';
import FieldList from './FieldList';

interface AdvancedTypingProps {
  config: AdvancedTypingConfig;
  typingConfig: TypingConfig;
  updateConfig: (updates: Partial<AdvancedTypingConfig>) => void;
  disabled: boolean;
}

const AdvancedTyping: React.FC<AdvancedTypingProps> = ({
  config,
  typingConfig,
  updateConfig,
  disabled,
}) => {
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleScanPage = async () => {
    setIsScanning(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        alert('Unable to access the current tab');
        return;
      }

      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('moz-extension://')) {
        alert('Cannot scan this page. Please navigate to a regular website.');
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scanPageForFields,
      });

      if (results?.[0]?.result) {
        const fields = results[0].result as DetectedField[];
        setDetectedFields(fields);
        if (fields.length === 0) {
          alert('No input fields found on this page.');
        }
      }
    } catch (error) {
      console.error('Error scanning page:', error);
      alert('Failed to scan the page. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleStartTyping = async () => {
    const enabledFields = detectedFields.filter(field => field.enabled);
    
    if (enabledFields.length === 0) {
      alert('Please enable at least one field to type into.');
      return;
    }

    const fieldsWithText = enabledFields.filter(field => field.text.trim());
    if (fieldsWithText.length === 0) {
      alert('Please add text to at least one enabled field.');
      return;
    }

    setIsTyping(true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        alert('Unable to access the current tab');
        return;
      }

      // Hide extension if requested
      if (config.hideExtension) {
        window.close();
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: executeAdvancedTyping,
        args: [{
          fields: fieldsWithText.sort((a, b) => a.priority - b.priority),
          typingConfig,
          advancedConfig: config,
        }],
      });

    } catch (error) {
      console.error('Error executing advanced typing:', error);
      alert('Failed to execute typing. Please try again.');
    } finally {
      if (!config.hideExtension) {
        setIsTyping(false);
      }
    }
  };

  const updateField = (id: string, updates: Partial<DetectedField>) => {
    setDetectedFields(fields => 
      fields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const reorderFields = (newFields: DetectedField[]) => {
    // Update priority based on new order
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      priority: index + 1,
    }));
    setDetectedFields(updatedFields);
  };

  return (
    <div className="space-y-6">
      {/* Scan Page Section */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleScanPage}
          disabled={disabled || isScanning || isTyping}
          className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   text-white font-semibold rounded-xl transition-all duration-200
                   transform hover:scale-[1.02] active:scale-[0.98]
                   shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          <Scan className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Scan Page'}</span>
        </button>

        {detectedFields.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            Found {detectedFields.length} input field{detectedFields.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Detected Fields */}
      {detectedFields.length > 0 && (
        <FieldList
          fields={detectedFields}
          onUpdateField={updateField}
          onReorderFields={reorderFields}
          disabled={disabled || isTyping}
        />
      )}

      {/* Advanced Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <Settings className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Advanced Settings</h3>
        </div>

        {/* Initial Delay */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">Initial Delay</label>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {config.initialDelay === 0 ? 'No delay' : `${config.initialDelay} second${config.initialDelay !== 1 ? 's' : ''}`}
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={config.initialDelay}
              onChange={(e) => updateConfig({ initialDelay: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                       slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4
                       slider-thumb:rounded-full slider-thumb:bg-primary-500
                       slider-thumb:cursor-pointer slider-thumb:shadow-lg"
              disabled={disabled || isTyping}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0s</span>
              <span>10s</span>
            </div>
          </div>
        </div>

        {/* Inter-field Delay */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Timer className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-semibold text-gray-700">Inter-field Delay</label>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {config.interFieldDelay === 0 ? 'No delay' : `${config.interFieldDelay} second${config.interFieldDelay !== 1 ? 's' : ''}`}
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={config.interFieldDelay}
              onChange={(e) => updateConfig({ interFieldDelay: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                       slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4
                       slider-thumb:rounded-full slider-thumb:bg-primary-500
                       slider-thumb:cursor-pointer slider-thumb:shadow-lg"
              disabled={disabled || isTyping}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0s</span>
              <span>5s</span>
            </div>
          </div>
        </div>

        {/* Hide Extension Toggle */}
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <EyeOff className="w-4 h-4 text-gray-600" />
            <div>
              <label className="text-sm font-semibold text-gray-700">Hide Extension</label>
              <p className="text-xs text-gray-500">Close popup during typing</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => updateConfig({ hideExtension: !config.hideExtension })}
            disabled={disabled || isTyping}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       ${config.hideExtension ? 'bg-primary-500' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                         ${config.hideExtension ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Start Typing Button */}
      {detectedFields.length > 0 && (
        <button
          type="button"
          onClick={handleStartTyping}
          disabled={disabled || isTyping || detectedFields.filter(f => f.enabled && f.text.trim()).length === 0}
          className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   text-white font-semibold rounded-xl transition-all duration-200
                   transform hover:scale-[1.02] active:scale-[0.98]
                   shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>{isTyping ? 'Typing...' : 'Start Typing'}</span>
        </button>
      )}
    </div>
  );
};

// Content script function to scan for input fields
function scanPageForFields(): DetectedField[] {
  const fields: DetectedField[] = [];
  let idCounter = 1;

  // Find all input, textarea, and contenteditable elements
  const selectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="search"]',
    'input[type="url"]',
    'input[type="tel"]',
    'input:not([type])',
    'textarea',
    '[contenteditable="true"]',
  ];

  const elements = document.querySelectorAll(selectors.join(', '));
  
  elements.forEach((element) => {
    // Skip hidden or disabled elements
    if (element instanceof HTMLElement) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return;
      }
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (element.disabled || element.readOnly) {
        return;
      }
    }

    // Generate a unique selector for this element
    const generateSelector = (el: Element): string => {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className.trim().split(/\s+/).join('.');
        return `${el.tagName.toLowerCase()}.${classes}`;
      }
      return el.tagName.toLowerCase();
    };

    // Get label text
    const getFieldLabel = (el: Element): string => {
      // Check for associated label
      if (el.id) {
        const label = document.querySelector(`label[for="${el.id}"]`);
        if (label?.textContent) return label.textContent.trim();
      }

      // Check for parent label
      const parentLabel = el.closest('label');
      if (parentLabel?.textContent) {
        return parentLabel.textContent.replace(el.textContent || '', '').trim();
      }

      // Check for placeholder
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        if (el.placeholder) return el.placeholder;
      }

      // Check for aria-label
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel) return ariaLabel;

      // Check for preceding text
      const prevSibling = el.previousElementSibling;
      if (prevSibling?.textContent) {
        return prevSibling.textContent.trim();
      }

      return `Field ${idCounter}`;
    };

    const field: DetectedField = {
      id: `field_${idCounter++}`,
      priority: fields.length + 1,
      label: getFieldLabel(element),
      text: '',
      enabled: true,
      selector: generateSelector(element),
      elementType: element.tagName.toLowerCase() === 'textarea' ? 'textarea' :
                   element.hasAttribute('contenteditable') ? 'contenteditable' : 'input',
      placeholder: (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) ? 
                   element.placeholder : undefined,
    };

    fields.push(field);

    // Add visual highlight
    element.setAttribute('data-typing-field', field.id);
    const originalStyle = element.getAttribute('style') || '';
    element.setAttribute('data-original-style', originalStyle);
    element.style.outline = '2px solid rgba(59, 130, 246, 0.5)';
    element.style.outlineOffset = '2px';
  });

  return fields;
}

// Content script function to execute advanced typing
async function executeAdvancedTyping({
  fields,
  typingConfig,
  advancedConfig,
}: {
  fields: DetectedField[];
  typingConfig: TypingConfig;
  advancedConfig: AdvancedTypingConfig;
}) {
  // Wait for initial delay
  if (advancedConfig.initialDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, advancedConfig.initialDelay * 1000));
  }

  // Type into each field sequentially
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    
    try {
      // Find the element
      const element = document.querySelector(field.selector) as HTMLInputElement | HTMLTextAreaElement | HTMLElement;
      
      if (!element) {
        console.warn(`Element not found for selector: ${field.selector}`);
        continue;
      }

      // Focus the element
      element.focus();
      
      // Clear existing content
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = '';
      } else if (element.isContentEditable) {
        element.textContent = '';
      }

      // Type the text using existing typing logic
      await new Promise<void>((resolve) => {
        const text = field.text;
        let currentIndex = 0;

        const typeChar = () => {
          if (currentIndex >= text.length) {
            resolve();
            return;
          }

          const char = text[currentIndex];
          
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
          } else if (element.isContentEditable) {
            element.textContent += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }

          currentIndex++;
          
          const delay = typingConfig.typingStyle === 'random' 
            ? Math.random() * (typingConfig.delay * 2) + (typingConfig.delay * 0.5)
            : typingConfig.delay;
          
          setTimeout(typeChar, Math.max(delay, 10));
        };

        typeChar();
      });

      // Wait for inter-field delay (except for last field)
      if (i < fields.length - 1 && advancedConfig.interFieldDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, advancedConfig.interFieldDelay * 1000));
      }

    } catch (error) {
      console.error(`Error typing into field ${field.id}:`, error);
    }
  }

  // Clean up highlights
  fields.forEach(field => {
    const element = document.querySelector(`[data-typing-field="${field.id}"]`);
    if (element instanceof HTMLElement) {
      const originalStyle = element.getAttribute('data-original-style') || '';
      element.setAttribute('style', originalStyle);
      element.removeAttribute('data-typing-field');
      element.removeAttribute('data-original-style');
    }
  });
}

export default AdvancedTyping;