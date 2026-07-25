import type React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled = false, ariaLabel }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors
                 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-1
                 disabled:cursor-not-allowed disabled:opacity-50
                 ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                   ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
};

export default Switch;
