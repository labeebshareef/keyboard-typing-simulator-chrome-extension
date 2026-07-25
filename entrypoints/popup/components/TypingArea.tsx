import type React from 'react';

interface TypingAreaProps {
  text: string;
  setText: (text: string) => void;
  disabled: boolean;
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, setText, disabled }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="text-input" className="block text-sm font-semibold text-[var(--text)]">
        Text to Type
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter the text you want to simulate typing..."
        // biome-ignore lint/a11y/noAutofocus: single-purpose popup; the textarea is the primary task
        autoFocus
        className="h-24 w-full resize-none rounded-lg border border-[var(--border)]
                 bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text)] shadow-sm
                 transition-colors duration-200 placeholder:text-gray-400
                 focus:border-transparent focus:ring-2 focus:ring-primary-500"
        disabled={disabled}
      />
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>{text.length} characters</span>
        <span>{text.split(' ').filter((word) => word.length > 0).length} words</span>
      </div>
    </div>
  );
};

export default TypingArea;
