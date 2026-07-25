import { afterEach, describe, expect, it } from 'vitest';
import { DEMO_PRESETS, getAiAvailability } from './ai';
import { LOCAL_DEMO_TEXTS } from './sample-data';

type MutableGlobal = { LanguageModel?: { availability(): Promise<string> } };

const setLanguageModel = (value: MutableGlobal['LanguageModel']) => {
  (globalThis as MutableGlobal).LanguageModel = value;
};

afterEach(() => {
  (globalThis as MutableGlobal).LanguageModel = undefined;
});

describe('getAiAvailability', () => {
  it("returns 'unavailable' when the Prompt API is missing", async () => {
    expect(await getAiAvailability()).toBe('unavailable');
  });

  it('passes through known availability states', async () => {
    for (const state of ['downloadable', 'downloading', 'available'] as const) {
      setLanguageModel({ availability: () => Promise.resolve(state) });
      expect(await getAiAvailability()).toBe(state);
    }
  });

  it("maps unknown states and errors to 'unavailable'", async () => {
    setLanguageModel({ availability: () => Promise.resolve('something-new') });
    expect(await getAiAvailability()).toBe('unavailable');

    setLanguageModel({ availability: () => Promise.reject(new Error('boom')) });
    expect(await getAiAvailability()).toBe('unavailable');
  });
});

describe('DEMO_PRESETS', () => {
  it('every preset has a local fallback text', () => {
    for (const preset of DEMO_PRESETS) {
      expect(LOCAL_DEMO_TEXTS[preset.id]).toBeTruthy();
    }
  });
});
