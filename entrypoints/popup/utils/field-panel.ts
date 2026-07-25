/**
 * Field-assistant prompt panel — vanilla DOM inside the assistant's closed
 * shadow root (no React on host pages). Talks to the background worker over a
 * Port for generation; inserts by calling back into the page's typing engine.
 *
 * Lifecycle: created once per assistant mount; open(field, anchor) shows it
 * for a field, close() hides it. destroy() tears it down with the assistant.
 */
import { DEMO_PRESETS, type DemoPreset } from './ai';
import { ASSISTANT_PORT, type PanelToWorker, type WorkerToPanel } from './assistant-messages';
import { LOCAL_DEMO_TEXTS } from './sample-data';

export interface FieldPanelDeps {
  shadow: ShadowRoot;
  /** Focus the field and type `text` into it via the engine. */
  typeIntoField: (field: HTMLElement, text: string) => void;
  /** Notified when the panel opens/closes so the host can hold the icon. */
  onOpenChange: (open: boolean) => void;
}

interface FieldMeta {
  label: string;
  placeholder: string;
}

const PANEL_WIDTH = 320;
type Availability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

const fieldMetaOf = (field: HTMLElement): FieldMeta => {
  const labelled =
    field.getAttribute('aria-label') ??
    (field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`)?.textContent : '') ??
    field.closest('label')?.textContent ??
    '';
  const placeholder =
    field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
      ? field.placeholder
      : '';
  return { label: labelled.trim().slice(0, 80), placeholder: placeholder.trim().slice(0, 80) };
};

const buildInstruction = (meta: FieldMeta, userPrompt: string): string => {
  const where = meta.label
    ? ` for a form field labeled "${meta.label}"`
    : meta.placeholder
      ? ` for a form field (placeholder "${meta.placeholder}")`
      : '';
  return `Write short, realistic plain text to type${where}. ${userPrompt}. Plain text only, no quotes.`;
};

export function createFieldPanel(deps: FieldPanelDeps) {
  const { shadow, typeIntoField, onOpenChange } = deps;

  const style = document.createElement('style');
  style.textContent = `
    .kts-panel {
      position: fixed;
      width: ${PANEL_WIDTH}px;
      max-width: calc(100vw - 16px);
      background: #ffffff;
      color: #172033;
      border: 1px solid #d7dce3;
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
      z-index: 2147483647;
      font: 13px/1.45 system-ui, -apple-system, sans-serif;
      display: none;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
    }
    .kts-panel.kts-open { display: flex; }
    .kts-row { display: flex; align-items: center; gap: 6px; cursor: move; touch-action: none; user-select: none; }
    .kts-title { font-weight: 600; font-size: 12px; }
    .kts-drag-hint { font-size: 11px; color: #8a919c; margin-right: 2px; cursor: move; }
    .kts-sub { font-size: 10px; color: #8a919c; margin-left: auto; }
    .kts-x { margin-left: 6px; border: none; background: transparent; cursor: pointer; color: #8a919c; font-size: 15px; line-height: 1; padding: 2px 4px; border-radius: 4px; }
    .kts-x:hover { background: rgba(127,127,127,.18); }
    .kts-chips { display: flex; flex-wrap: wrap; gap: 5px; }
    /* Theme-independent: text inherits the panel colour (always readable),
       fill/border use translucent grey that reads on light and dark alike. */
    .kts-chip { border: 1px solid rgba(127,127,127,.42); background: rgba(127,127,127,.10); border-radius: 999px; padding: 3px 9px; font-size: 11px; cursor: pointer; color: inherit; }
    .kts-chip:hover { border-color: #8384dd; color: #8384dd; background: rgba(91,91,214,.14); }
    .kts-chip:disabled { opacity: .5; cursor: not-allowed; }
    @media (prefers-color-scheme: dark) {
      .kts-panel { background: #22252a; color: #f3f4f6; border-color: #3d424a; }
      .kts-panel textarea, .kts-panel .kts-preview { background: #17191d; color: #f3f4f6; border-color: #3d424a; }
    }
    .kts-panel textarea { width: 100%; box-sizing: border-box; resize: none; height: 46px; border: 1px solid #d7dce3; border-radius: 8px; padding: 7px 9px; font: inherit; }
    .kts-panel textarea:focus, .kts-preview:focus-within { outline: 2px solid #5b5bd6; outline-offset: 1px; }
    .kts-gen-row { display: flex; gap: 6px; }
    .kts-btn { border: none; border-radius: 8px; padding: 7px 12px; font: inherit; font-weight: 600; font-size: 12px; cursor: pointer; }
    .kts-btn-primary { background: #5b5bd6; color: #fff; }
    .kts-btn-primary:hover { background: #4a48c4; }
    .kts-btn-primary:disabled { background: #c9c9f0; cursor: not-allowed; }
    .kts-btn-ghost { background: transparent; border: 1px solid #d7dce3; color: inherit; }
    .kts-btn-ghost:hover { background: rgba(0,0,0,.05); }
    .kts-btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
    .kts-preview { min-height: 40px; max-height: 130px; overflow-y: auto; border: 1px solid #d7dce3; border-radius: 8px; padding: 7px 9px; font-size: 12px; white-space: pre-wrap; word-break: break-word; }
    .kts-preview:empty::before { content: attr(data-placeholder); color: #9aa1ac; }
    .kts-note { font-size: 10px; color: #8a919c; }
    .kts-foot { display: flex; align-items: center; gap: 6px; }
    .kts-foot .kts-hide { margin-left: auto; font-size: 10px; color: #8a919c; background: none; border: none; cursor: pointer; }
    .kts-foot .kts-hide:hover { text-decoration: underline; }
  `;
  shadow.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'kts-panel';
  panel.innerHTML = `
    <div class="kts-row" title="Drag to move">
      <span class="kts-drag-hint" aria-hidden="true">⠿</span>
      <span class="kts-title">GhostType ✨</span>
      <span class="kts-sub" data-el="sub"></span>
      <button class="kts-x" data-el="close" aria-label="Close" title="Close (Esc)">✕</button>
    </div>
    <div class="kts-chips" data-el="chips"></div>
    <textarea data-el="prompt" placeholder="Describe what to write…"></textarea>
    <div class="kts-gen-row">
      <button class="kts-btn kts-btn-primary" data-el="generate" style="flex:1">Generate</button>
    </div>
    <div class="kts-preview" data-el="preview" tabindex="0" data-placeholder="Generated text appears here…"></div>
    <div class="kts-note" data-el="note">Runs on your device · nothing leaves your machine.</div>
    <div class="kts-foot">
      <button class="kts-btn kts-btn-primary" data-el="insert" style="flex:1">Insert &amp; Type</button>
      <button class="kts-btn kts-btn-ghost" data-el="regen" title="Regenerate">↻</button>
      <button class="kts-hide" data-el="hide">Hide on this page</button>
    </div>
  `;
  shadow.appendChild(panel);

  const el = <T extends HTMLElement>(name: string) =>
    panel.querySelector(`[data-el="${name}"]`) as T;
  const subEl = el<HTMLSpanElement>('sub');
  const chipsEl = el<HTMLDivElement>('chips');
  const promptEl = el<HTMLTextAreaElement>('prompt');
  const generateBtn = el<HTMLButtonElement>('generate');
  const previewEl = el<HTMLDivElement>('preview');
  const noteEl = el<HTMLDivElement>('note');
  const insertBtn = el<HTMLButtonElement>('insert');
  const regenBtn = el<HTMLButtonElement>('regen');

  let open = false;
  let targetField: HTMLElement | null = null;
  let availability: Availability = 'unavailable';
  let port: chrome.runtime.Port | null = null;
  let requestSeq = 0;
  let activeGenId = 0;
  let lastInstruction = '';
  let busy = false;

  const connect = (): chrome.runtime.Port | null => {
    if (port) return port;
    try {
      port = chrome.runtime.connect({ name: ASSISTANT_PORT });
      port.onMessage.addListener(onWorkerMessage);
      port.onDisconnect.addListener(() => {
        port = null;
      });
      return port;
    } catch {
      port = null;
      return null;
    }
  };

  const post = (message: PanelToWorker) => connect()?.postMessage(message);

  const setBusy = (value: boolean) => {
    busy = value;
    generateBtn.disabled = value || availability !== 'available' || !promptEl.value.trim();
    regenBtn.disabled = value || availability !== 'available' || !lastInstruction;
    insertBtn.disabled = value || !previewEl.textContent?.trim();
    generateBtn.textContent = value ? 'Generating…' : 'Generate';
  };

  const applyAvailability = () => {
    const ready = availability === 'available';
    promptEl.style.display = ready ? '' : 'none';
    if (generateBtn.parentElement) generateBtn.parentElement.style.display = ready ? '' : 'none';
    regenBtn.style.display = ready ? '' : 'none';
    noteEl.textContent = ready
      ? 'Runs on your device · nothing leaves your machine.'
      : availability === 'downloadable' || availability === 'downloading'
        ? 'Enable on-device AI from the GhostType popup. Chips insert samples meanwhile.'
        : 'On-device AI needs Chrome 138+ on a supported desktop. Chips insert samples.';
    setBusy(false);
    reclamp();
  };

  const renderChips = (presets: DemoPreset[]) => {
    chipsEl.replaceChildren();
    for (const preset of presets) {
      const chip = document.createElement('button');
      chip.className = 'kts-chip';
      chip.type = 'button';
      chip.textContent = preset.label;
      chip.disabled = busy;
      chip.addEventListener('mousedown', (event) => event.preventDefault());
      chip.addEventListener('click', () => useChip(preset));
      chipsEl.appendChild(chip);
    }
    reclamp();
  };

  const useChip = (preset: DemoPreset) => {
    if (availability !== 'available') {
      // No model: drop the built-in sample straight into the preview.
      previewEl.textContent = LOCAL_DEMO_TEXTS[preset.id] ?? '';
      setBusy(false);
      reclamp();
      return;
    }
    if (!targetField) return;
    runGenerate(buildInstruction(fieldMetaOf(targetField), preset.instruction));
  };

  const runGenerate = (instruction: string) => {
    lastInstruction = instruction;
    activeGenId = ++requestSeq;
    previewEl.textContent = '';
    setBusy(true);
    post({ type: 'generate', id: activeGenId, instruction });
  };

  function onWorkerMessage(message: WorkerToPanel) {
    switch (message.type) {
      case 'availability':
        availability = message.state;
        subEl.textContent = availability === 'available' ? 'on-device' : 'samples';
        applyAvailability();
        return;
      case 'presets':
        if (message.presets?.length) renderChips(message.presets);
        return;
      case 'chunk':
        if (message.id === activeGenId) {
          previewEl.textContent = message.text;
          insertBtn.disabled = !message.text.trim();
          reclamp();
        }
        return;
      case 'done':
        if (message.id === activeGenId) {
          previewEl.textContent = message.text;
          setBusy(false);
          reclamp();
        }
        return;
      case 'error':
        if (message.id === activeGenId) {
          noteEl.textContent = 'Generation failed — try again.';
          setBusy(false);
        }
        return;
      case 'aborted':
        if (message.id === activeGenId) setBusy(false);
        return;
    }
  }

  // -- interactions ----------------------------------------------------------

  promptEl.addEventListener('input', () => setBusy(busy));
  promptEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (promptEl.value.trim() && targetField && availability === 'available') {
        runGenerate(buildInstruction(fieldMetaOf(targetField), promptEl.value.trim()));
      }
    }
  });
  generateBtn.addEventListener('click', () => {
    if (promptEl.value.trim() && targetField) {
      runGenerate(buildInstruction(fieldMetaOf(targetField), promptEl.value.trim()));
    }
  });
  regenBtn.addEventListener('click', () => {
    if (lastInstruction) runGenerate(lastInstruction);
  });
  insertBtn.addEventListener('click', () => {
    const text = previewEl.textContent?.trim();
    if (!text || !targetField) return;
    if (!targetField.isConnected) {
      noteEl.textContent = 'That field is gone — reopen on a field that still exists.';
      return;
    }
    const field = targetField;
    close();
    typeIntoField(field, text);
  });
  el<HTMLButtonElement>('close').addEventListener('click', () => close());
  el<HTMLButtonElement>('hide').addEventListener('click', () => {
    close();
    window.dispatchEvent(new CustomEvent('__ktsAssistantHide'));
  });
  // Keep field focus when interacting with the panel chrome.
  panel.addEventListener('mousedown', (event) => {
    if (event.target !== promptEl && event.target !== previewEl) event.preventDefault();
  });

  const onDocPointerDown = (event: Event) => {
    // Clicks inside the shadow retarget to the host; anything else closes.
    const host = shadow.host;
    if (event.target !== host) close();
  };
  const onDocKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      close();
    }
  };

  /** Keep the whole panel inside the viewport, respecting its current spot. */
  const clampIntoViewport = () => {
    const width = panel.offsetWidth || PANEL_WIDTH;
    const height = panel.offsetHeight || 260;
    let left = Number.parseFloat(panel.style.left) || 0;
    let top = Number.parseFloat(panel.style.top) || 0;
    left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - width - 8));
    top = Math.min(Math.max(8, top), Math.max(8, window.innerHeight - height - 8));
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  };

  /** Re-clamp after content grows (preview fills, chips/prompt toggle). */
  const reclamp = () => {
    if (open) requestAnimationFrame(clampIntoViewport);
  };

  const position = (anchor: DOMRect) => {
    const height = panel.offsetHeight || 260;
    const left = anchor.right - PANEL_WIDTH;
    let top = anchor.bottom + 6;
    // Prefer below the icon; flip above when there isn't room.
    if (top + height > window.innerHeight - 8) top = anchor.top - height - 6;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    clampIntoViewport();
  };

  // -- dragging (by the header) ---------------------------------------------
  let dragDX = 0;
  let dragDY = 0;
  const onDragMove = (event: PointerEvent) => {
    const width = panel.offsetWidth || PANEL_WIDTH;
    const height = panel.offsetHeight || 260;
    const left = Math.min(
      Math.max(8, event.clientX - dragDX),
      Math.max(8, window.innerWidth - width - 8)
    );
    const top = Math.min(
      Math.max(8, event.clientY - dragDY),
      Math.max(8, window.innerHeight - height - 8)
    );
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  };
  const onDragEnd = () => {
    document.removeEventListener('pointermove', onDragMove, true);
    document.removeEventListener('pointerup', onDragEnd, true);
  };
  const header = panel.querySelector('.kts-row') as HTMLElement;
  header.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('[data-el="close"]')) return; // let the close button work
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    dragDX = event.clientX - rect.left;
    dragDY = event.clientY - rect.top;
    document.addEventListener('pointermove', onDragMove, true);
    document.addEventListener('pointerup', onDragEnd, true);
  });

  return {
    isOpen: () => open,
    open(field: HTMLElement, anchor: DOMRect) {
      targetField = field;
      open = true;
      previewEl.textContent = '';
      lastInstruction = '';
      promptEl.value = '';
      panel.classList.add('kts-open');
      position(anchor);
      onOpenChange(true);
      // Fresh state each open.
      subEl.textContent = '…';
      post({ type: 'availability' });
      renderChips(DEMO_PRESETS);
      const meta = { host: location.hostname, title: document.title };
      if (meta.host)
        post({ type: 'presets', id: ++requestSeq, host: meta.host, title: meta.title });
      document.addEventListener('pointerdown', onDocPointerDown, true);
      document.addEventListener('keydown', onDocKeyDown, true);
      requestAnimationFrame(() => promptEl.focus());
    },
    close() {
      close();
    },
    destroy() {
      close();
      port?.disconnect();
      port = null;
      panel.remove();
      style.remove();
    },
  };

  function close() {
    if (!open) return;
    open = false;
    onDragEnd();
    if (activeGenId) post({ type: 'abort', id: activeGenId });
    panel.classList.remove('kts-open');
    document.removeEventListener('pointerdown', onDocPointerDown, true);
    document.removeEventListener('keydown', onDocKeyDown, true);
    onOpenChange(false);
    const field = targetField;
    targetField = null;
    if (field?.isConnected) field.focus();
  }
}
