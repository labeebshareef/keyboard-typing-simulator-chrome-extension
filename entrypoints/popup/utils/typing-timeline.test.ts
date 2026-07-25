import { describe, expect, it } from 'vitest';
import { buildTypingTimeline, createSeededRandom, textAt } from './typing-timeline';

const baseConfig = { delay: 50, typingStyle: 'normal' as const, includeMistakes: false };

describe('buildTypingTimeline', () => {
  it('ends with the full text and monotonic timestamps', () => {
    const timeline = buildTypingTimeline('hello world', baseConfig, { seed: 1 });
    expect(timeline.events[0]).toEqual({ time: 0, text: '' });
    expect(timeline.events[timeline.events.length - 1]?.text).toBe('hello world');
    for (let i = 1; i < timeline.events.length; i += 1) {
      expect(timeline.events[i].time).toBeGreaterThanOrEqual(timeline.events[i - 1].time);
    }
    expect(timeline.duration).toBeGreaterThanOrEqual(
      timeline.events[timeline.events.length - 1]?.time ?? 0
    );
  });

  it('is deterministic for a given seed', () => {
    const config = { ...baseConfig, typingStyle: 'random' as const, includeMistakes: true };
    const a = buildTypingTimeline('some sample text here', config, { seed: 42 });
    const b = buildTypingTimeline('some sample text here', config, { seed: 42 });
    expect(a).toEqual(b);
  });

  it('types word-by-word in word chunks', () => {
    const timeline = buildTypingTimeline('one two three', {
      ...baseConfig,
      typingStyle: 'word-by-word',
    });
    // initial empty event + one event per word
    expect(timeline.events).toHaveLength(4);
    expect(timeline.events[1].text).toBe('one ');
  });

  it('inserts and reverts mistakes without corrupting the final text', () => {
    const config = { ...baseConfig, includeMistakes: true };
    const text = 'a'.repeat(400);
    const timeline = buildTypingTimeline(text, config, { seed: 7 });
    expect(timeline.events[timeline.events.length - 1]?.text).toBe(text);
    // With 400 chars at 3% mistake rate and a fixed seed, at least one
    // mistake pair (insert then revert) must exist: some event's text is
    // shorter than its predecessor's.
    const hasRevert = timeline.events.some(
      (event, index) => index > 0 && event.text.length < timeline.events[index - 1].text.length
    );
    expect(hasRevert).toBe(true);
  });

  it('scales duration with the speed multiplier', () => {
    const slow = buildTypingTimeline('hello world', baseConfig, { seed: 1 });
    const fast = buildTypingTimeline('hello world', baseConfig, { seed: 1, speedMultiplier: 2 });
    expect(fast.duration).toBeCloseTo(slow.duration / 2, 5);
  });
});

describe('textAt', () => {
  it('returns the visible text for any point in time', () => {
    const timeline = buildTypingTimeline('abc', baseConfig);
    expect(textAt(timeline, -5)).toBe('');
    expect(textAt(timeline, 0)).not.toBe('abc');
    expect(textAt(timeline, timeline.duration + 1000)).toBe('abc');
  });
});

describe('createSeededRandom', () => {
  it('produces values in [0, 1) and repeats per seed', () => {
    const a = createSeededRandom(123);
    const b = createSeededRandom(123);
    for (let i = 0; i < 100; i += 1) {
      const value = a();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(b()).toBe(value);
    }
  });
});
