import { GripVertical, Hash, ToggleLeft, ToggleRight, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { DetectedField } from '../types';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface FieldListProps {
  fields: DetectedField[];
  onUpdateField: (id: string, updates: Partial<DetectedField>) => void;
  onReorderFields: (newFields: DetectedField[]) => void;
  disabled: boolean;
}

const FieldList: React.FC<FieldListProps> = ({
  fields,
  onUpdateField,
  onReorderFields,
  disabled,
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [tempPriority, setTempPriority] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);

  // Auto-scroll during drag
  const handleAutoScroll = (e: React.DragEvent) => {
    if (!containerRef.current || !draggedItem) return;

    const container = containerRef.current;
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
    const newPriority = parseInt(tempPriority, 10);
    
    if (isNaN(newPriority) || newPriority < 1 || newPriority > fields.length) {
      // Invalid priority, reset
      setEditingPriority(null);
      setTempPriority('');
      return;
    }

    // Find current field and target position
    const currentField = fields.find(f => f.id === fieldId);
    if (!currentField || currentField.priority === newPriority) {
      setEditingPriority(null);
      setTempPriority('');
      return;
    }

    // Reorder fields based on new priority
    const newFields = [...fields];
    const currentIndex = newFields.findIndex(f => f.id === fieldId);
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

  const getElementTypeIcon = (type: DetectedField['elementType']) => {
    switch (type) {
      case 'textarea':
        return '📝';
      case 'contenteditable':
        return '✏️';
      default:
        return '📄';
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-2 p-3 border-b border-emerald-200 bg-emerald-50/30 shrink-0">
        <Type className="w-4 h-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-emerald-700">Detected Fields</h3>
        <span className="text-xs text-emerald-500">({fields.length})</span>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-2"
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        {fields.map((field, index) => (
          <div
            key={field.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, field.id)}
            onDragOver={(e) => handleDragOver(e, field.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, field.id)}
            onDragEnd={handleDragEnd}
            className={`
              p-2 bg-white rounded border border-emerald-200 shadow-sm
              ${dragOverItem === field.id ? 'border-emerald-400 bg-emerald-50 scale-[1.01] shadow-md ring-1 ring-emerald-200' : ''}
              ${draggedItem === field.id ? 'opacity-60 rotate-1 scale-95 shadow-lg' : ''}
              ${!disabled ? 'cursor-move hover:border-emerald-300 hover:shadow-md' : ''}
              transition-all duration-200 ease-in-out transform
            `}
          >
            {/* Compact Header Row */}
            <div className="flex items-center space-x-2 mb-2">
              {/* Drag Handle & Priority */}
              <div className="flex items-center space-x-1 shrink-0">
                {!disabled && (
                  <GripVertical className="w-3 h-3 text-emerald-400" />
                )}
                <div className="flex items-center space-x-1">
                  <Hash className="w-2 h-2 text-emerald-400" />
                  {editingPriority === field.id ? (
                    <Input
                      type="number"
                      value={tempPriority}
                      onChange={(e) => setTempPriority(e.target.value)}
                      onBlur={() => handlePrioritySubmit(field.id)}
                      onKeyDown={(e) => handlePriorityKeyDown(e, field.id)}
                      className="w-6 h-4 text-xs font-mono text-center"
                      min="1"
                      max={fields.length}
                      autoFocus
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePriorityClick(field.id, field.priority)}
                      disabled={disabled}
                      className="h-4 w-4 p-0 text-xs font-mono text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800"
                      title="Click to edit priority"
                    >
                      {field.priority}
                    </Button>
                  )}
                </div>
              </div>

              {/* Field Type & Label */}
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-sm">{getElementTypeIcon(field.elementType)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">{field.label}</div>
                  <div className="text-xs text-emerald-600 truncate">
                    {getElementTypeLabel(field.elementType)}
                    {field.placeholder && ` • ${field.placeholder}`}
                  </div>
                </div>
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center space-x-1 shrink-0">
                <Switch
                  checked={field.enabled}
                  onCheckedChange={(checked) => onUpdateField(field.id, { enabled: checked })}
                  disabled={disabled}
                />
                <span className={cn(
                  "text-xs font-medium",
                  field.enabled ? "text-emerald-600" : "text-gray-400"
                )}>
                  {field.enabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>

            {/* Text Input - Compact */}
            <div className="space-y-1">
              <Textarea
                value={field.text}
                onChange={(e) => onUpdateField(field.id, { text: e.target.value })}
                placeholder="Text to type into this field..."
                className="min-h-[2rem] h-8 text-xs resize-none"
                disabled={disabled || !field.enabled}
              />

              {/* Character Count & Selector Info - Compact Row */}
              <div className="flex justify-between items-center text-xs text-emerald-500">
                <span>{field.text.length} chars</span>
                <span className="text-xs text-emerald-400 font-mono truncate max-w-[120px]">
                  {field.selector}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-emerald-500">
          <div className="text-center py-8">
            <Type className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
            <p className="text-sm">No fields detected yet.</p>
            <p className="text-xs">Click "Scan Page" to detect input fields.</p>
          </div>
        </div>
      )}

      {/* Enhanced Drag and Drop Instructions */}
      {fields.length > 1 && !disabled && (
        <div className="text-xs text-emerald-600 text-center py-2 bg-emerald-50 border-t border-emerald-200 shrink-0">
          <div className="flex items-center justify-center space-x-2">
            <GripVertical className="w-3 h-3" />
            <span>Drag to reorder • Click # to edit priority</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldList;
