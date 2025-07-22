/**
 * Analytics utility functions for Google Analytics 4 tracking
 */

export type TabType = 'basic_typing' | 'advanced_typing';
export type ButtonName =
  | 'scan_page'
  | 'start_typing'
  | 'pause_typing'
  | 'resume_typing'
  | 'stop_typing';
export type SettingName =
  | 'typing_speed'
  | 'initial_delay'
  | 'inter_field_delay'
  | 'hide_extension'
  | 'typing_sounds'
  | 'typing_style'
  | 'include_mistakes';
export type TypingMode = 'single_field' | 'batch_typing';

// Analytics event tracking functions
export const analytics = {
  /**
   * Track button clicks
   */
  trackButtonClick: async (buttonName: ButtonName, tabType: TabType) => {
    return sendAnalyticsEvent('button_click', {
      button_name: buttonName,
      tab_type: tabType,
    });
  },

  /**
   * Track settings changes
   */
  trackSettingChanged: async (
    settingName: SettingName,
    settingValue: string | number | boolean,
    tabType: TabType
  ) => {
    return sendAnalyticsEvent('setting_changed', {
      setting_name: settingName,
      setting_value: String(settingValue),
      tab_type: tabType,
    });
  },

  /**
   * Track typing session started
   */
  trackTypingStarted: async (fieldsCount: number, typingMode: TypingMode, textLength: number) => {
    return sendAnalyticsEvent('typing_started', {
      fields_count: fieldsCount,
      typing_mode: typingMode,
      text_length: textLength,
    });
  },

  /**
   * Track page scanning
   */
  trackPageScanned: async (fieldsDetected: number) => {
    return sendAnalyticsEvent('page_scanned', {
      fields_detected: fieldsDetected,
    });
  },

  /**
   * Track typing completion
   */
  trackTypingCompleted: async (
    fieldsCount: number,
    typingMode: TypingMode,
    textLength: number,
    success: boolean
  ) => {
    return sendAnalyticsEvent('typing_completed', {
      fields_count: fieldsCount,
      typing_mode: typingMode,
      text_length: textLength,
      success: success,
    });
  },

  /**
   * Track typing paused/resumed
   */
  trackTypingPauseResume: async (action: 'paused' | 'resumed', tabType: TabType) => {
    return sendAnalyticsEvent('typing_pause_resume', {
      action: action,
      tab_type: tabType,
    });
  },

  /**
   * Track typing stopped
   */
  trackTypingStopped: async (reason: 'manual' | 'error' | 'completed', tabType: TabType) => {
    return sendAnalyticsEvent('typing_stopped', {
      reason: reason,
      tab_type: tabType,
    });
  },
};

/**
 * Send analytics event to background script for GA4 tracking
 */
async function sendAnalyticsEvent(
  eventName: string,
  parameters: Record<string, any>
): Promise<boolean> {
  try {
    // Add timestamp and session info to all events
    const enrichedParameters = {
      ...parameters,
      timestamp: Date.now(),
      extension_version: '2.3.0',
    };

    const response = await chrome.runtime.sendMessage({
      type: 'track_event',
      event_name: eventName,
      parameters: enrichedParameters,
    });

    if (response?.success) {
      console.log(`Analytics event tracked: ${eventName}`, enrichedParameters);
      return true;
    } else {
      console.warn(`Failed to track analytics event: ${eventName}`, response?.error);
      return false;
    }
  } catch (error) {
    console.error(`Error sending analytics event: ${eventName}`, error);

    // Try to store the event locally for retry later
    try {
      const failedEvents = JSON.parse(localStorage.getItem('failedAnalyticsEvents') || '[]');
      failedEvents.push({
        eventName,
        parameters,
        timestamp: Date.now(),
      });
      // Keep only last 50 failed events to prevent storage overflow
      localStorage.setItem('failedAnalyticsEvents', JSON.stringify(failedEvents.slice(-50)));
    } catch (storageError) {
      console.warn('Could not store failed analytics event:', storageError);
    }

    return false;
  }
}

/**
 * Helper function to determine current tab type based on URL or context
 */
export function getCurrentTabType(): TabType {
  // This could be enhanced to detect the current tab context
  // For now, we'll pass it explicitly from components
  return 'basic_typing';
}

/**
 * Helper function to determine typing mode based on number of fields
 */
export function getTypingMode(fieldsCount: number): TypingMode {
  return fieldsCount <= 1 ? 'single_field' : 'batch_typing';
}

/**
 * Debounce function for settings changes to avoid too many events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Create a debounced version of setting tracking for performance
 */
export const debouncedTrackSetting = debounce(analytics.trackSettingChanged, 500);

/**
 * Retry failed analytics events
 */
export async function retryFailedEvents(): Promise<void> {
  try {
    const failedEvents = JSON.parse(localStorage.getItem('failedAnalyticsEvents') || '[]');
    if (failedEvents.length === 0) return;

    console.log(`Retrying ${failedEvents.length} failed analytics events`);

    const successfulEvents: number[] = [];

    for (let i = 0; i < failedEvents.length; i++) {
      const event = failedEvents[i];
      const success = await sendAnalyticsEvent(event.eventName, event.parameters);
      if (success) {
        successfulEvents.push(i);
      }
    }

    // Remove successful events from failed events list
    if (successfulEvents.length > 0) {
      const remainingEvents = failedEvents.filter((_, index) => !successfulEvents.includes(index));
      localStorage.setItem('failedAnalyticsEvents', JSON.stringify(remainingEvents));
      console.log(`Successfully retried ${successfulEvents.length} analytics events`);
    }
  } catch (error) {
    console.error('Error retrying failed analytics events:', error);
  }
}

/**
 * Initialize analytics and retry any failed events
 */
export async function initializeAnalytics(): Promise<void> {
  // Wait a bit for the background script to initialize
  setTimeout(retryFailedEvents, 2000);
}
