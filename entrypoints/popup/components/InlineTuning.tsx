import type React from 'react';
import type { TypingConfig, TypingStyle } from '../types';

interface InlineTuningProps {
  typingConfig: TypingConfig;
  updateTypingConfig: (updates: Partial<TypingConfig>) => void;
  disabled: boolean;
}

export const getDelayLabel = (delayValue: number): string => {
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

const getTypingStyleDescription = (style: TypingStyle): string => {
  switch (style) {
    case 'normal':
      return 'Consistent timing';
    case 'random':
      return 'Variable human-like timing';
    case 'word-by-word':
      return 'Types complete words';
    default:
      return '';
  }
};

/** Tier-2 tuning shown inline in Basic mode: speed + style, no card chrome. */
const InlineTuning: React.FC<InlineTuningProps> = ({
  typingConfig,
  updateTypingConfig,
  disabled,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="typing-speed" className="text-xs font-semibold text-[var(--text)]">
            Speed
          </label>
          <span className="text-xs text-[var(--text-muted)]">
            <span className={`font-medium ${getDelayColor(typingConfig.delay)}`}>
              {getDelayLabel(typingConfig.delay)}
            </span>
            {' · '}
            {typingConfig.delay}ms
          </span>
        </div>
        <input
          id="typing-speed"
          type="range"
          min="10"
          max="300"
          value={typingConfig.delay}
          onChange={(e) => updateTypingConfig({ delay: Number(e.target.value) })}
          disabled={disabled}
          className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200
                     disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="typing-style" className="text-xs font-semibold text-[var(--text)]">
            Style
          </label>
          <select
            id="typing-style"
            value={typingConfig.typingStyle}
            onChange={(e) => updateTypingConfig({ typingStyle: e.target.value as TypingStyle })}
            disabled={disabled}
            className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-raised)]
                       px-2 py-1.5 text-xs text-[var(--text)] transition-colors
                       focus:border-transparent focus:ring-1 focus:ring-primary-500"
          >
            <option value="normal">Normal</option>
            <option value="random">Random Delay</option>
            <option value="word-by-word">Word-by-Word</option>
          </select>
        </div>
        <p className="mt-1 text-right text-xs text-[var(--text-muted)]">
          {getTypingStyleDescription(typingConfig.typingStyle)}
        </p>
      </div>
    </div>
  );
};

export default InlineTuning;
