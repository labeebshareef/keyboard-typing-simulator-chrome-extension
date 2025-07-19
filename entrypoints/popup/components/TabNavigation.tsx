import type React from 'react';

interface TabNavigationProps {
  activeTab: 'basic' | 'advanced';
  onTabChange: (tab: 'basic' | 'advanced') => void;
  disabled?: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  disabled = false,
}) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      <button
        type="button"
        onClick={() => onTabChange('basic')}
        disabled={disabled}
        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
          activeTab === 'basic'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Basic Typing
      </button>
      <button
        type="button"
        onClick={() => onTabChange('advanced')}
        disabled={disabled}
        className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
          activeTab === 'advanced'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Advanced Typing
      </button>
    </div>
  );
};

export default TabNavigation;
