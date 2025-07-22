# Google Analytics 4 Integration

This extension now includes comprehensive Google Analytics 4 (GA4) tracking to monitor user interactions and feature usage.

## Implementation Overview

### 1. GA4 Setup
- **Background Script**: GA4 is initialized in the background script (`entrypoints/background.ts`)
- **Configuration**: Uses `localStorage` as client storage with privacy-focused settings:
  - `client_storage: 'localStorage'`
  - `anonymize_ip: true`
  - `allow_google_signals: false`
  - `send_page_view: false`

### 2. Event Tracking

#### Button Clicks
All button interactions are tracked with the following events:
- `button_click` with parameters:
  - `button_name`: 'scan_page', 'start_typing', 'pause_typing', 'resume_typing', 'stop_typing'
  - `tab_type`: 'basic_typing', 'advanced_typing'

#### Settings Changes
All settings modifications are tracked with:
- `setting_changed` with parameters:
  - `setting_name`: 'typing_speed', 'initial_delay', 'inter_field_delay', 'hide_extension', 'typing_sounds', 'typing_style', 'include_mistakes'
  - `setting_value`: The actual value set
  - `tab_type`: 'basic_typing', 'advanced_typing'

#### Feature Usage
- `typing_started`: Tracks when typing sessions begin
  - `fields_count`: Number of fields being typed into
  - `typing_mode`: 'single_field' or 'batch_typing'
  - `text_length`: Total character count

- `page_scanned`: Tracks page scanning in advanced mode
  - `fields_detected`: Number of input fields found

- `typing_completed`: Tracks when typing finishes
  - `success`: Whether typing completed successfully or failed

- `typing_stopped`: Tracks when typing is manually stopped or encounters errors
  - `reason`: 'manual', 'error', or 'completed'

### 3. Technical Implementation

#### Files Modified
- `wxt.config.ts`: Added GA4 domain permissions
- `entrypoints/background.ts`: GA4 initialization and event handling
- `entrypoints/popup/utils/analytics.ts`: Analytics utility functions
- `entrypoints/popup/components/TypingControls.tsx`: Button click tracking
- `entrypoints/popup/components/AdvancedTyping.tsx`: Advanced mode tracking
- `entrypoints/popup/components/SettingsSidebar.tsx`: Settings change tracking
- `entrypoints/popup/hooks/useTypingSimulator.ts`: Basic typing session tracking
- `entrypoints/popup/App.tsx`: Analytics initialization

#### Key Features
- **Error Handling**: Failed events are stored locally and retried later
- **Debouncing**: Settings changes are debounced to prevent spam
- **Privacy**: IP anonymization and no Google signals
- **Offline Support**: Events are queued when analytics is unavailable

### 4. Configuration

To use with a real GA4 property:
1. Replace `G-DEMO1234567` in `background.ts` with your actual GA4 Measurement ID
2. Ensure your GA4 property is configured to accept events from Chrome extensions
3. The extension already includes the necessary permissions in manifest.json

### 5. Data Enrichment

All events include additional metadata:
- `timestamp`: Event timestamp
- `extension_version`: Current extension version
- `tab_type`: Which tab the user was on
- Error context for debugging

This implementation provides comprehensive analytics while maintaining user privacy and following GA4 best practices for Chrome extensions.