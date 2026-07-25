/**
 * Message protocol for the field-assistant Port between the in-page panel and
 * the background service worker. Generation runs in the worker because the
 * Prompt API is only guaranteed in extension contexts, not content scripts.
 */
import type { DemoPreset } from './ai';

export const ASSISTANT_PORT = 'kts-assistant';

export type PanelToWorker =
  | { type: 'availability' }
  | { type: 'presets'; id: number; host: string; title: string }
  | { type: 'generate'; id: number; instruction: string }
  | { type: 'abort'; id: number };

export type WorkerToPanel =
  | { type: 'availability'; state: 'unavailable' | 'downloadable' | 'downloading' | 'available' }
  | { type: 'presets'; id: number; presets: DemoPreset[] | null }
  | { type: 'chunk'; id: number; text: string }
  | { type: 'done'; id: number; text: string }
  | { type: 'error'; id: number }
  | { type: 'aborted'; id: number };
