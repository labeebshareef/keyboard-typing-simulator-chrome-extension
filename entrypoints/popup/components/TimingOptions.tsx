import type React from 'react';
import type { AdvancedTypingConfig } from '../types';
import Collapsible from './Collapsible';
import Switch from './Switch';

interface TimingOptionsProps {
  config: AdvancedTypingConfig;
  updateConfig: (updates: Partial<AdvancedTypingConfig>) => void;
  disabled: boolean;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
}

const formatSeconds = (value: number) => (value === 0 ? '0s' : `${value}s`);

/** Advanced-mode timing settings behind a persisted disclosure with a live value summary. */
const TimingOptions: React.FC<TimingOptionsProps> = ({
  config,
  updateConfig,
  disabled,
  expanded,
  onToggle,
}) => {
  const summary = `start ${formatSeconds(config.initialDelay)} · between ${formatSeconds(
    config.interFieldDelay
  )} · hide ${config.hideExtension ? 'on' : 'off'}`;

  return (
    <Collapsible
      id="timing-options"
      title="Timing"
      summary={summary}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="initial-delay" className="text-xs font-semibold text-[var(--text)]">
            Initial delay
          </label>
          <span className="text-xs text-[var(--text-muted)]">
            {config.initialDelay === 0 ? 'No delay' : `${config.initialDelay}s`}
          </span>
        </div>
        <input
          id="initial-delay"
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={config.initialDelay}
          onChange={(e) => updateConfig({ initialDelay: Number(e.target.value) })}
          disabled={disabled}
          className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200
                     disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="inter-field-delay" className="text-xs font-semibold text-[var(--text)]">
            Inter-field delay
          </label>
          <span className="text-xs text-[var(--text-muted)]">
            {config.interFieldDelay === 0 ? 'No delay' : `${config.interFieldDelay}s`}
          </span>
        </div>
        <input
          id="inter-field-delay"
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={config.interFieldDelay}
          onChange={(e) => updateConfig({ interFieldDelay: Number(e.target.value) })}
          disabled={disabled}
          className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200
                     disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[var(--text)]">Hide extension</span>
          <p className="text-xs text-[var(--text-muted)]">Close the popup while typing</p>
        </div>
        <Switch
          checked={config.hideExtension}
          onChange={(checked) => updateConfig({ hideExtension: checked })}
          disabled={disabled}
          ariaLabel="Hide extension while typing"
        />
      </div>
    </Collapsible>
  );
};

export default TimingOptions;
