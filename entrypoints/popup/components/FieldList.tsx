import { GripVertical, Hash, ToggleLeft, ToggleRight, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { DetectedField } from '../types';

interface FieldListProps {
  fields: DetectedField[];
  onUpdateField: (id: string, updates: Partial<DetectedField>) => void;
  onReorderFields: (newFields: DetectedField[]) => void;
  disabled: boolean;
  /** The element that actually scrolls (owned by AdvancedTyping) — used for drag auto-scroll. */
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  /** Focus target after a successful scan so keyboard users land on the results. */
  headingRef?: React.RefObject<HTMLHeadingElement>;
}

const FieldList: React.FC<FieldListProps> = ({
  fields,
  onUpdateField,
  onReorderFields,
  disabled,
  scrollContainerRef,
  headingRef,
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [tempPriority, setTempPriority] = useState<string>('');
  const autoScrollRef = useRef<number | null>(null);
  const priorityInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll the real scroll container while dragging near its edges
  const handleAutoScroll = (e: React.DragEvent) => {
    const container = scrollContainerRef.current;
    if (!container || !draggedItem) return;

    const rect = container.getBoundingClientRect();
    const scrollThreshold = 50; // pixels from edge to trigger scroll
    const scrollSpeed = 5; // pixels per frame

    const mouseY = e.clientY - rect.top;

    if (mouseY < scrollThreshold) {
      // Scroll up
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      autoScrollRef.current = window.setInterval(() => {
        container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
      }, 16);
    } else if (mouseY > rect.height - scrollThreshold) {
      // Scroll down
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      autoScrollRef.current = window.setInterval(() => {
        container.scrollTop = Math.min(
          container.scrollHeight - container.clientHeight,
          container.scrollTop + scrollSpeed
        );
      }, 16);
    } else {
      // Stop scrolling
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
  };

  // Clean up auto-scroll on component unmount
  useEffect(() => {
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editingPriority) priorityInputRef.current?.focus();
  }, [editingPriority]);

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    if (disabled) return;
    setDraggedItem(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', fieldId);
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(fieldId);
    handleAutoScroll(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the actual drop zone, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null);
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    if (disabled) return;
    e.preventDefault();
    setDragOverItem(null);

    // Clear auto-scroll
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }

    const draggedFieldId = e.dataTransfer.getData('text/plain');
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = fields.findIndex((f) => f.id === draggedFieldId);
    const targetIndex = fields.findIndex((f) => f.id === targetFieldId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newFields = [...fields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, removed);

    onReorderFields(newFields);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  // Handle priority editing
  const handlePriorityClick = (fieldId: string, currentPriority: number) => {
    if (disabled) return;
    setEditingPriority(fieldId);
    setTempPriority(currentPriority.toString());
  };

  const handlePrioritySubmit = (fieldId: string) => {
    const newPriority = Number.parseInt(tempPriority, 10);

    if (Number.isNaN(newPriority) || newPriority < 1 || newPriority > fields.length) {
      // Invalid priority, reset
      setEditingPriority(null);
      setTempPriority('');
      return;
    }

    // Find current field and target position
    const currentField = fields.find((f) => f.id === fieldId);
    if (!currentField || currentField.priority === newPriority) {
      setEditingPriority(null);
      setTempPriority('');
      return;
    }

    // Reorder fields based on new priority
    const newFields = [...fields];
    const currentIndex = newFields.findIndex((f) => f.id === fieldId);
    const [removed] = newFields.splice(currentIndex, 1);

    // Insert at new position (convert 1-based priority to 0-based index)
    const targetIndex = Math.min(newPriority - 1, newFields.length);
    newFields.splice(targetIndex, 0, removed);

    onReorderFields(newFields);
    setEditingPriority(null);
    setTempPriority('');
  };

  const handlePriorityKeyDown = (e: React.KeyboardEvent, fieldId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePrioritySubmit(fieldId);
    } else if (e.key === 'Escape') {
      setEditingPriority(null);
      setTempPriority('');
    }
  };

  const getElementTypeLabel = (type: DetectedField['elementType']) => {
    switch (type) {
      case 'textarea':
        return 'Textarea';
      case 'contenteditable':
        return 'Editable';
      default:
        return 'Input';
    }
  };

  if (fields.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--text-muted)]">
        <Type className="mx-auto mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">No fields detected yet.</p>
        <p className="text-xs">Click "Scan page" to detect input fields.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Type className="h-4 w-4 text-[var(--text-muted)]" />
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-sm font-semibold text-[var(--text)] outline-none"
        >
          Detected Fields
        </h3>
        <span className="text-xs text-[var(--text-muted)]">({fields.length})</span>
      </div>

      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, field.id)}
            onDragOver={(e) => handleDragOver(e, field.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, field.id)}
            onDragEnd={handleDragEnd}
            className={`
              rounded-md border border-[var(--border)] bg-[var(--surface-raised)] p-3
              ${dragOverItem === field.id ? 'scale-[1.02] border-blue-400 shadow-md ring-2 ring-blue-200' : ''}
              ${draggedItem === field.id ? 'rotate-1 scale-95 opacity-60 shadow-lg' : ''}
              ${!disabled ? 'cursor-move hover:shadow-md' : ''}
              transition-colors duration-200
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Drag Handle & Priority */}
              <div className="mt-1 flex items-center space-x-2">
                {!disabled && (
                  <div className="group">
                    <GripVertical className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-600" />
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Hash className="h-3 w-3 text-gray-400" />
                  {editingPriority === field.id ? (
                    <input
                      ref={priorityInputRef}
                      aria-label={`Priority for ${field.label}`}
                      type="number"
                      value={tempPriority}
                      onChange={(e) => setTempPriority(e.target.value)}
                      onBlur={() => handlePrioritySubmit(field.id)}
                      onKeyDown={(e) => handlePriorityKeyDown(e, field.id)}
                      className="h-5 w-8 rounded border border-blue-300 text-center font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      min="1"
                      max={fields.length}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePriorityClick(field.id, field.priority)}
                      disabled={disabled}
                      className="min-w-[1.5rem] rounded px-1 py-0.5 text-center font-mono text-xs
                                 text-[var(--text-muted)] transition-colors hover:bg-black/5
                                 hover:text-[var(--text)] dark:hover:bg-white/5"
                      title="Click to edit priority"
                      aria-label={`Change priority for ${field.label}, currently ${field.priority}`}
                    >
                      {field.priority}
                    </button>
                  )}
                </div>
              </div>

              {/* Field Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{field.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {getElementTypeLabel(field.elementType)}
                      {field.placeholder && ` • ${field.placeholder}`}
                    </div>
                  </div>

                  {/* Enable/Disable Toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.enabled}
                    aria-label={`${field.enabled ? 'Disable' : 'Enable'} ${field.label}`}
                    onClick={() => onUpdateField(field.id, { enabled: !field.enabled })}
                    disabled={disabled}
                    className="flex items-center space-x-1 rounded p-1 text-sm
                               text-[var(--text-muted)] transition-colors hover:bg-black/5
                               hover:text-[var(--text)] dark:hover:bg-white/5"
                  >
                    {field.enabled ? (
                      <>
                        <ToggleRight className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-green-600">On</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Off</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Text Input — one line at rest, grows on focus for density */}
                <div className="space-y-1">
                  <label className="sr-only" htmlFor={`field-text-${field.id}`}>
                    Text for {field.label}
                  </label>
                  <textarea
                    id={`field-text-${field.id}`}
                    value={field.text}
                    onChange={(e) => onUpdateField(field.id, { text: e.target.value })}
                    placeholder="Text to type into this field..."
                    rows={1}
                    className="h-9 w-full resize-none rounded-md border border-[var(--border)]
                             bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text)]
                             transition-all duration-200 focus:h-16 focus:border-transparent
                             focus:ring-2 focus:ring-primary-500
                             disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={disabled || !field.enabled}
                  />

                  {/* Character Count & Selector Info */}
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{field.text.length} characters</span>
                    <span className="max-w-[150px] truncate font-mono text-xs opacity-70">
                      {field.selector}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drag and Drop Instructions */}
      {fields.length > 1 && !disabled && (
        <div
          className="flex items-center justify-center space-x-2 rounded-md border
                        border-[var(--border)] py-1.5 text-center text-xs text-[var(--text-muted)]"
        >
          <GripVertical className="h-3 w-3" />
          <span>Drag to reorder • Click priority # to edit</span>
        </div>
      )}
    </div>
  );
};

export default FieldList;
