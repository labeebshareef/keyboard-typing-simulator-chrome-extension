/**
 * WebM (MediaRecorder + captureStream) and GIF (gifenc) encoders for the
 * export page. No permissions involved — everything is local canvas work.
 *
 * WebM records in real time (MediaRecorder timestamps by wall clock), so the
 * export takes as long as the clip; the UI warns to keep the tab focused
 * because a backgrounded tab throttles requestAnimationFrame and drops
 * frames. GIF renders offline, frame by frame, faster than real time.
 */

import { GIFEncoder, applyPalette, quantize } from 'gifenc';

export const WEBM_MIME_CANDIDATES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

export interface EncodeJob {
  canvas: HTMLCanvasElement;
  /** Draw the frame for time `t` (ms) onto the canvas. */
  drawAt: (t: number) => void;
  /** Timeline duration in ms (excluding the end frame). */
  durationMs: number;
  /** Extra branded end-frame time in ms (0 = disabled). */
  endFrameMs: number;
  onProgress: (fraction: number) => void;
  signal?: AbortSignal;
}

const raf = () =>
  new Promise<number>((resolve) => {
    requestAnimationFrame((t) => resolve(t));
  });

export async function encodeWebM(job: EncodeJob): Promise<Blob> {
  const { canvas, drawAt, durationMs, endFrameMs, onProgress, signal } = job;
  const mimeType = WEBM_MIME_CANDIDATES.find((candidate) =>
    MediaRecorder.isTypeSupported(candidate)
  );
  if (!mimeType) throw new Error('WebM recording is not supported in this browser.');

  const total = durationMs + endFrameMs;
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = () => reject(new Error('Recording failed.'));
  });

  drawAt(0);
  recorder.start(250);
  const startedAt = performance.now();

  for (;;) {
    await raf();
    if (signal?.aborted) {
      recorder.stop();
      await stopped.catch(() => undefined);
      throw new DOMException('Aborted', 'AbortError');
    }
    const elapsed = performance.now() - startedAt;
    if (elapsed >= total) break;
    drawAt(elapsed);
    onProgress(Math.min(1, elapsed / total));
  }

  drawAt(total);
  recorder.stop();
  await stopped;
  onProgress(1);
  return new Blob(chunks, { type: mimeType });
}

const GIF_FPS = 15;
/** Frames above this produce very large files; the UI steers to WebM instead. */
export const GIF_FRAME_SOFT_LIMIT = 1200;

export async function encodeGif(job: EncodeJob): Promise<Blob> {
  const { canvas, drawAt, durationMs, endFrameMs, onProgress, signal } = job;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D context unavailable.');

  const frameDelay = Math.round(1000 / GIF_FPS);
  const total = durationMs + endFrameMs;
  const frameCount = Math.max(1, Math.ceil(total / frameDelay));

  const gif = GIFEncoder();
  for (let frame = 0; frame <= frameCount; frame += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const t = Math.min(total, frame * frameDelay);
    drawAt(t);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, canvas.width, canvas.height, { palette, delay: frameDelay });
    onProgress(frame / frameCount);
    // Yield to the UI thread between frames so progress stays visible.
    if (frame % 5 === 0) await raf();
  }
  gif.finish();
  onProgress(1);
  return new Blob([gif.bytes()], { type: 'image/gif' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
