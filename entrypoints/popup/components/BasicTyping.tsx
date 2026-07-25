import type React from 'react';
import type { TypingConfig } from '../types';
import InlineTuning from './InlineTuning';
import MoreOptions from './MoreOptions';
import TypingArea from './TypingArea';

interface BasicTypingProps {
  text: string;
  setText: (text: string) => void;
  typingConfig: TypingConfig;
  updateTypingConfig: (updates: Partial<TypingConfig>) => void;
  disabled: boolean;
  moreOptionsExpanded: boolean;
  onToggleMoreOptions: (expanded: boolean) => void;
}

const BasicTyping: React.FC<BasicTypingProps> = ({
  text,
  setText,
  typingConfig,
  updateTypingConfig,
  disabled,
  moreOptionsExpanded,
  onToggleMoreOptions,
}) => {
  return (
    <div className="scroll-region min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <TypingArea text={text} setText={setText} disabled={disabled} />

      <InlineTuning
        typingConfig={typingConfig}
        updateTypingConfig={updateTypingConfig}
        disabled={disabled}
      />

      <MoreOptions
        typingConfig={typingConfig}
        updateTypingConfig={updateTypingConfig}
        disabled={disabled}
        expanded={moreOptionsExpanded}
        onToggle={onToggleMoreOptions}
      />
    </div>
  );
};

export default BasicTyping;
