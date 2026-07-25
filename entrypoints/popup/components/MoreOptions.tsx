import type React from 'react';
import type { TypingConfig } from '../types';
import Collapsible from './Collapsible';
import Switch from './Switch';

interface MoreOptionsProps {
  typingConfig: TypingConfig;
  updateTypingConfig: (updates: Partial<TypingConfig>) => void;
  disabled: boolean;
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
}

/** Tier-3 set-and-forget options behind a persisted disclosure. */
const MoreOptions: React.FC<MoreOptionsProps> = ({
  typingConfig,
  updateTypingConfig,
  disabled,
  expanded,
  onToggle,
}) => {
  const summary = `mistakes ${typingConfig.includeMistakes ? 'on' : 'off'} · sounds ${
    typingConfig.soundEnabled ? 'on' : 'off'
  }`;

  return (
    <Collapsible
      id="more-options"
      title="More options"
      summary={summary}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[var(--text)]">Include mistakes</span>
          <p className="text-xs text-[var(--text-muted)]">Typos & corrections</p>
        </div>
        <Switch
          checked={typingConfig.includeMistakes}
          onChange={(checked) => updateTypingConfig({ includeMistakes: checked })}
          disabled={disabled}
          ariaLabel="Include mistakes"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[var(--text)]">Typing sounds</span>
          <p className="text-xs text-[var(--text-muted)]">Audio feedback</p>
        </div>
        <Switch
          checked={typingConfig.soundEnabled}
          onChange={(checked) => updateTypingConfig({ soundEnabled: checked })}
          disabled={disabled}
          ariaLabel="Typing sounds"
        />
      </div>
    </Collapsible>
  );
};

export default MoreOptions;
