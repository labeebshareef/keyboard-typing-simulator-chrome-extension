/**
 * Pure keystroke-timeline generator for the video/GIF export feature.
 *
 * Mirrors the injected engine's timing model exactly (base delay, random
 * style spread, word-by-word ×3 pacing, mistake insert → 1.5× dwell → revert)
 * but runs standalone: the export page re-synthesizes a session from
 * text + config instead of recording the live page session. The engine's
 * timing is itself generated from config, so a re-synthesis has the same
 * statistical shape — and it means export works for any text, any time,
 * with no page coupling.
 *
 * Deterministic when given a seed (mulberry32), which is also what makes
 * this testable.
 */

import type { TypingConfig, TypingStyle } from '../types';

export interface TimelineEvent {
  /** Milliseconds from timeline start. */
  time: number;
  /** Full visible text at this moment. */
  text: string;
}

export interface TypingTimeline {
  events: TimelineEvent[];
  /** Total duration in milliseconds (including the trailing delay). */
  duration: number;
}

export type TimelineConfig = Pick<TypingConfig, 'delay' | 'typingStyle' | 'includeMistakes'>;

export interface TimelineOptions {
  /** Seed for deterministic output (tests, reproducible renders). */
  seed?: number;
  /** >1 speeds typing up, <1 slows it down. Applied to every delay. */
  speedMultiplier?: number;
}

const WRONG_CHARACTERS = 'qwertyuiopasdfghjklzxcvbnm';

/** mulberry32 — tiny deterministic PRNG, plenty for typing jitter. */
export const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export function buildTypingTimeline(
  text: string,
  config: TimelineConfig,
  options: TimelineOptions = {}
): TypingTimeline {
  const random = options.seed !== undefined ? createSeededRandom(options.seed) : Math.random;
  const speed =
    options.speedMultiplier && options.speedMultiplier > 0 ? options.speedMultiplier : 1;
  const baseDelay = Math.max(10, config.delay) / speed;
  const style: TypingStyle = config.typingStyle;

  const getDelay = () => (style === 'random' ? baseDelay * (0.5 + random() * 2) : baseDelay);

  const chunks = style === 'word-by-word' ? (text.match(/\S+\s*/g) ?? []) : Array.from(text);

  const events: TimelineEvent[] = [{ time: 0, text: '' }];
  let current = '';
  let time = 0;
  let typedCharacters = 0;

  for (const chunk of chunks) {
    // Same mistake model as the engine: single-character chunks only, never
    // on the first character, 3% chance; type the wrong key, notice it
    // (1.5× dwell), delete it, then continue.
    if (config.includeMistakes && chunk.length === 1 && typedCharacters > 0 && random() < 0.03) {
      const wrong = WRONG_CHARACTERS[Math.floor(random() * WRONG_CHARACTERS.length)];
      events.push({ time, text: current + wrong });
      time += getDelay() * 1.5;
      events.push({ time, text: current });
      time += getDelay();
    }

    current += chunk;
    events.push({ time, text: current });
    typedCharacters += chunk.length;
    time += style === 'word-by-word' ? getDelay() * 3 : getDelay();
  }

  return { events, duration: time };
}

/** Visible text at `time` ms — binary search over the event list. */
export function textAt(timeline: TypingTimeline, time: number): string {
  const { events } = timeline;
  if (events.length === 0) return '';
  let low = 0;
  let high = events.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (events[mid].time <= time) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return events[low].text;
}
