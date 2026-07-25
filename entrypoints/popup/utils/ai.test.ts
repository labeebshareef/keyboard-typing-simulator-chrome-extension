import { afterEach, describe, expect, it } from 'vitest';
import { type AiSession, DEMO_PRESETS, generateSitePresets, getAiAvailability } from './ai';
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

const sessionReturning = (raw: string): AiSession => ({
  prompt: () => Promise.resolve(raw),
  promptStreaming: () => {
    throw new Error('not used');
  },
  destroy: () => undefined,
});

const context = { host: 'shop.example.com', title: 'Example Shop — Checkout' };

describe('generateSitePresets', () => {
  it('maps schema-constrained JSON to usable presets', async () => {
    const raw = JSON.stringify({
      presets: [
        { label: 'Review', instruction: 'Write a 40-word product review.' },
        { label: 'Support note', instruction: 'Write a short delivery question.' },
        { label: 'Address', instruction: 'Write a fictional shipping address.' },
      ],
    });
    const presets = await generateSitePresets(sessionReturning(raw), context);
    expect(presets).toHaveLength(3);
    expect(presets[0]).toEqual({
      id: 'site-0',
      label: 'Review',
      instruction: 'Write a 40-word product review.',
    });
  });

  it('truncates over-long labels and caps at four presets', async () => {
    const raw = JSON.stringify({
      presets: Array.from({ length: 6 }, (_, index) => ({
        label: `An extremely verbose preset label ${index}`,
        instruction: `Write sample text number ${index}.`,
      })),
    });
    const presets = await generateSitePresets(sessionReturning(raw), context);
    expect(presets).toHaveLength(4);
    for (const preset of presets) {
      expect(preset.label.length).toBeLessThanOrEqual(24);
    }
  });

  it('throws on malformed JSON so callers keep the static fallback', async () => {
    await expect(generateSitePresets(sessionReturning('not json'), context)).rejects.toThrow();
  });

  it('throws when too few usable presets survive validation', async () => {
    const raw = JSON.stringify({
      presets: [
        { label: 'Only one', instruction: 'Write something.' },
        { label: '', instruction: '' },
      ],
    });
    await expect(generateSitePresets(sessionReturning(raw), context)).rejects.toThrow();
  });
});
