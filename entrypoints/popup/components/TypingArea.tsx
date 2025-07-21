import type React from 'react';

interface TypingAreaProps {
  text: string;
  setText: (text: string) => void;
  disabled: boolean;
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, setText, disabled }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="text-input" className="block text-sm font-semibold text-gray-700">
        Text to Type
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter the text you want to simulate typing..."
        className="w-full h-20 px-3 py-2 border border-gray-200 rounded-lg resize-none 
                 focus:ring-2 focus:ring-primary-500 focus:border-transparent
                 transition-all duration-200 text-sm
                 placeholder-gray-400 bg-white shadow-sm"
        disabled={disabled}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{text.length} characters</span>
        <span>{text.split(' ').filter((word) => word.length > 0).length} words</span>
      </div>
    </div>
  );
};

export default TypingArea;
