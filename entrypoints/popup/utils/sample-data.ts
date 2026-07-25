/**
 * Deterministic local sample-data generator — the always-available fallback
 * for AI Assist (and the whole feature on machines without Gemini Nano).
 * Zero dependencies, works offline, nothing leaves the machine.
 */

import type { DetectedField } from '../types';

const FIRST_NAMES = ['Maya', 'Jonas', 'Priya', 'Leo', 'Sofia', 'Omar', 'Elena', 'Kai'];
const LAST_NAMES = ['Andersen', 'Rivera', 'Nakamura', 'Haddad', 'Kowalski', 'Mensah', 'Silva'];
const COMPANIES = ['Northwind Labs', 'Acme Studio', 'Bluefjord', 'Helio Systems', 'Papercrane'];
const STREETS = ['14 Elm Street', '221 Harbor Ave', '8 Rosewood Lane', '450 Market Way'];
const CITIES = ['Portland', 'Leeds', 'Utrecht', 'Kyoto', 'Valencia', 'Wellington'];
const SENTENCES = [
  'Thanks for reaching out — happy to help with this.',
  'The quick brown fox jumps over the lazy dog.',
  'We shipped the update this morning and everything looks stable.',
  'Let me know if Thursday afternoon works for a quick call.',
  'This is sample text generated locally for demo purposes.',
];

let counter = 0;
const pick = <T>(pool: T[]): T => pool[counter++ % pool.length];

function valueForField(field: DetectedField): string {
  const hint = `${field.label} ${field.placeholder ?? ''}`.toLowerCase();
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);

  if (/e-?mail/.test(hint)) return `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
  if (/phone|tel|mobile/.test(hint)) return `+1 555 01${String((counter % 90) + 10)}`;
  if (/first\s*name/.test(hint)) return first;
  if (/last\s*name|surname/.test(hint)) return last;
  if (/full\s*name|^name|your\s*name/.test(hint)) return `${first} ${last}`;
  if (/company|organi[sz]ation|employer/.test(hint)) return pick(COMPANIES);
  if (/address|street/.test(hint)) return pick(STREETS);
  if (/city|town/.test(hint)) return pick(CITIES);
  if (/zip|postal/.test(hint)) return String(10000 + ((counter * 7919) % 89999));
  if (/url|website/.test(hint)) return 'https://example.com';
  if (/subject|title/.test(hint)) return 'Quick question about the demo';
  if (field.elementType === 'textarea' || field.elementType === 'contenteditable') {
    return `${pick(SENTENCES)} ${pick(SENTENCES)}`;
  }
  return pick(SENTENCES);
}

/** Fill every enabled field with a plausible local value. */
export function localFillFields(fields: DetectedField[]): DetectedField[] {
  return fields.map((field) => (field.enabled ? { ...field, text: valueForField(field) } : field));
}

/** Local stand-ins for the demo-copy presets when Nano is unavailable. */
export const LOCAL_DEMO_TEXTS: Record<string, string> = {
  'support-reply':
    "Hi Maya, thanks for flagging this — I'm sorry about the delay. Your order left our warehouse this morning and the tracking link below is live now. As an apology we've added free express shipping to your next order. Anything else, just reply here!",
  'product-blurb':
    'Meet Flowdesk — the workspace that tidies itself. Capture tasks, notes and follow-ups in one place, and let smart lists surface exactly what needs you today. Less sorting, more doing.',
  bio: 'Product designer with eight years of experience building B2B tools. Previously led design systems at Northwind Labs. Loves whiteboards, hates lorem ipsum.',
  email:
    "Hi team, I'd like to get our project kickoff on the calendar for next week. Could you share your availability Tuesday or Wednesday afternoon? Agenda: goals, timeline, and owner assignments — 30 minutes should do it. Thanks!",
  commit:
    'fix(parser): handle two-digit years in date strings\n\nDates like 03/04/99 previously parsed as year 0099; they now pivot on 1970.',
};
