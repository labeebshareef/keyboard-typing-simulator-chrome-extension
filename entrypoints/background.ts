export default defineBackground(() => {
  console.log('Background script loaded');

  // Initialize Google Analytics 4
  initializeGA4();
});

function initializeGA4() {
  try {
    // Check if gtag is already loaded
    if (typeof globalThis.gtag !== 'undefined') {
      console.log('GA4 already initialized');
      return;
    }

    // GA4 Measurement ID - This should be replaced with an actual GA4 Measurement ID
    // For demo purposes, we're using a placeholder. In production, this should be:
    // 1. A real GA4 measurement ID like 'G-XXXXXXXXXX'
    // 2. Stored in environment variables or configuration
    const GA4_MEASUREMENT_ID = 'G-DEMO1234567'; // Replace with actual measurement ID

    console.log('Initializing GA4 with measurement ID:', GA4_MEASUREMENT_ID);

    // Load Google Analytics 4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    script.onload = () => console.log('GA4 script loaded successfully');
    script.onerror = () => console.error('Failed to load GA4 script');
    document.head.appendChild(script);

    // Initialize gtag function
    globalThis.dataLayer = globalThis.dataLayer || [];
    // biome-ignore lint/suspicious/noExplicitAny: GA4 gtag function expects any type
    globalThis.gtag = (...args: any[]) => {
      globalThis.dataLayer.push(args);
    };

    // Configure GA4 with localStorage as client storage
    globalThis.gtag('js', new Date());
    globalThis.gtag('config', GA4_MEASUREMENT_ID, {
      client_storage: 'localStorage',
      anonymize_ip: true,
      allow_google_signals: false,
      send_page_view: false, // We'll handle page views manually if needed
    });

    console.log('GA4 configured successfully with localStorage client storage');
  } catch (error) {
    console.error('Failed to initialize GA4:', error);
  }
}

// Make gtag function available to content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'track_event') {
    try {
      console.log('Tracking event:', message.event_name, message.parameters);

      if (typeof globalThis.gtag === 'function') {
        globalThis.gtag('event', message.event_name, message.parameters);
        console.log('Event tracked successfully:', message.event_name);
        sendResponse({ success: true });
      } else {
        console.warn('GA4 not initialized - gtag function not available');
        sendResponse({ success: false, error: 'GA4 not initialized' });
      }
    } catch (error) {
      console.error('Error tracking event:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep message channel open for async response
});
