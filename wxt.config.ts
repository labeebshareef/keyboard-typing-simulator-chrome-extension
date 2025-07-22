import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Keyboard Typing Simulator',
    description:
      'Intelligent typing simulator extension for web developers with adjustable speed controls',
    version: '2.3.0',
    permissions: ['scripting', 'activeTab', 'storage'],
    host_permissions: ['https://www.google-analytics.com/*'],
    icons: {
      16: '/icons/icon16.png',
      48: '/icons/icon48.png',
      128: '/icons/icon128.png',
    },
  },
});
