import type React from 'react';
import type { PopupTab } from '../types';

interface TabNavigationProps {
  activeTab: PopupTab;
  onTabChange: (tab: PopupTab) => void;
  disabled?: boolean;
}

const TABS: Array<{ id: PopupTab; label: string }> = [
  { id: 'basic', label: 'Basic Typing' },
  { id: 'advanced', label: 'Advanced Typing' },
];

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  disabled = false,
}) => {
  return (
    <div
      className="flex rounded-md border border-[var(--border)] bg-[var(--surface)] p-1"
      role="tablist"
      aria-label="Typing mode"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          disabled={disabled}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
            activeTab === tab.id
              ? 'bg-[var(--surface-raised)] text-[var(--text)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
