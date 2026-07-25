/**
 * On-device AI ("AI Assist") via Chrome's built-in Prompt API / Gemini Nano.
 *
 * Constraints handled here (verified against Chrome docs, July 2026):
 * - Global `LanguageModel` object; extensions from Chrome 138+, desktop only.
 *   No manifest permission required in stable.
 * - availability(): 'unavailable' | 'downloadable' | 'downloading' | 'available'.
 * - create() triggers the model download when 'downloadable' and requires a
 *   user gesture — only call it from a click handler. Progress arrives via the
 *   monitor's 'downloadprogress' event.
 * - The model can self-evict when free disk drops below ~10 GB, so
 *   availability is re-checked on every popup open and never cached.
 * - Structured output: pass a JSON Schema as `responseConstraint` (137+).
 *
 * Design rule: every entry point has a deterministic local fallback
 * (sample-data.ts), so the feature works for 100% of users and never blocks
 * on Nano support.
 */

import type { DetectedField } from '../types';
import { localFillFields } from './sample-data';

// ---------------------------------------------------------------------------
// Minimal typings for the Prompt API (not yet in TypeScript's lib.dom)
// ---------------------------------------------------------------------------

interface AiPromptOptions {
  signal?: AbortSignal;
  responseConstraint?: object;
}

export interface AiSession {
  prompt(input: string, options?: AiPromptOptions): Promise<string>;
  promptStreaming(input: string, options?: AiPromptOptions): AsyncIterable<string>;
  destroy(): void;
}

interface AiCreateOptions {
  initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  monitor?(monitor: EventTarget): void;
}

interface LanguageModelStatic {
  availability(): Promise<string>;
  create(options?: AiCreateOptions): Promise<AiSession>;
}

/** Feature-detect the Prompt API without polluting the global type space. */
const getLanguageModel = (): LanguageModelStatic | undefined =>
  (globalThis as { LanguageModel?: LanguageModelStatic }).LanguageModel;

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export type AiAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

const KNOWN_STATES: AiAvailability[] = ['downloadable', 'downloading', 'available'];

export async function getAiAvailability(): Promise<AiAvailability> {
  const languageModel = getLanguageModel();
  if (!languageModel) return 'unavailable';
  try {
    const state = await languageModel.availability();
    return KNOWN_STATES.includes(state as AiAvailability)
      ? (state as AiAvailability)
      : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

// ---------------------------------------------------------------------------
// Session creation (call from a click handler when state is 'downloadable')
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  'You write short, realistic sample text for product demos and form testing. ' +
  'Output plain text only: no markdown, no surrounding quotes, no explanations.';

export async function createAiSession(
  onDownloadProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<AiSession> {
  const languageModel = getLanguageModel();
  if (!languageModel) throw new Error('Prompt API unavailable');
  return languageModel.create({
    initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
    signal,
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (event) => {
        const loaded = (event as unknown as { loaded?: number }).loaded;
        if (typeof loaded === 'number') onDownloadProgress?.(Math.round(loaded * 100));
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Generator 1: demo copy (Basic tab) — streams into the Text-to-Type box
// ---------------------------------------------------------------------------

export interface DemoPreset {
  id: string;
  label: string;
  instruction: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'support-reply',
    label: 'Support reply',
    instruction:
      'Write a friendly customer-support reply (about 60 words) resolving a shipping-delay complaint.',
  },
  {
    id: 'product-blurb',
    label: 'Product blurb',
    instruction:
      'Write an enthusiastic 40-word product description for a fictional productivity app.',
  },
  {
    id: 'bio',
    label: 'Short bio',
    instruction: 'Write a 35-word professional bio for a fictional product designer.',
  },
  {
    id: 'email',
    label: 'Email',
    instruction:
      'Write a brief, polite work email (about 70 words) scheduling a project kickoff meeting.',
  },
  {
    id: 'commit',
    label: 'Commit message',
    instruction:
      'Write a conventional-commits style commit message with a one-sentence body for a bug fix in a date parser.',
  },
];

export async function streamGeneration(
  session: AiSession,
  instruction: string,
  onUpdate: (fullTextSoFar: string) => void,
  signal?: AbortSignal
): Promise<string> {
  let accumulated = '';
  const stream = session.promptStreaming(instruction, { signal });
  for await (const chunk of stream) {
    accumulated += chunk;
    onUpdate(accumulated);
  }
  return accumulated.trim();
}

// ---------------------------------------------------------------------------
// Generator 2: rewrite (Basic tab, when the box already has text)
// ---------------------------------------------------------------------------

export type RewriteMode = 'shorter' | 'longer' | 'friendlier' | 'fix-typos';

export const REWRITE_MODES: Array<{ id: RewriteMode; label: string }> = [
  { id: 'shorter', label: 'Shorter' },
  { id: 'longer', label: 'Longer' },
  { id: 'friendlier', label: 'Friendlier' },
  { id: 'fix-typos', label: 'Fix typos' },
];

const REWRITE_INSTRUCTIONS: Record<RewriteMode, string> = {
  shorter: 'Rewrite the following text to be roughly half as long, keeping the meaning:',
  longer: 'Expand the following text to roughly twice the length, same tone:',
  friendlier: 'Rewrite the following text in a warmer, friendlier tone, similar length:',
  'fix-typos': 'Fix spelling, grammar and punctuation in the following text. Change nothing else:',
};

export function streamRewrite(
  session: AiSession,
  mode: RewriteMode,
  text: string,
  onUpdate: (fullTextSoFar: string) => void,
  signal?: AbortSignal
): Promise<string> {
  return streamGeneration(session, `${REWRITE_INSTRUCTIONS[mode]}\n\n${text}`, onUpdate, signal);
}

// ---------------------------------------------------------------------------
// Generator 3: AI field fill (Advanced tab) — structured output.
// Sends ONLY field metadata (labels/placeholders/types), never page content.
// ---------------------------------------------------------------------------

export async function aiFillFields(
  session: AiSession,
  fields: DetectedField[],
  signal?: AbortSignal
): Promise<DetectedField[]> {
  const targets = fields.filter((field) => field.enabled);
  if (targets.length === 0) return fields;

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: targets.map((field) => field.id),
    properties: Object.fromEntries(targets.map((field) => [field.id, { type: 'string' }])),
  };

  const brief = targets
    .map(
      (field) =>
        `- id "${field.id}": label "${field.label}"${field.placeholder ? `, placeholder "${field.placeholder}"` : ''} (${field.elementType})`
    )
    .join('\n');

  try {
    const raw = await session.prompt(
      `Generate realistic, internally consistent sample values for these form fields (one fictional person/company across all fields):\n${brief}\nReturn JSON mapping each id to a plausible concise value.`,
      { responseConstraint: schema, signal }
    );
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return fields.map((field) => {
      const value = parsed[field.id];
      return typeof value === 'string' && value.length > 0 ? { ...field, text: value } : field;
    });
  } catch {
    // Model refused / parse failed / aborted mid-flight: degrade silently to
    // the deterministic generator rather than surfacing an AI error.
    return localFillFields(fields);
  }
}
