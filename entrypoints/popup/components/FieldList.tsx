import { GripVertical, Hash, ToggleLeft, ToggleRight, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { DetectedField } from '../types';

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
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-3">
        <Type className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Detected Fields</h3>
        <span className="text-xs text-gray-500">({fields.length})</span>
      </div>

      <div 
        ref={containerRef}
        className="max-h-[170px] overflow-y-auto space-y-2 relative"
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
              p-3 bg-white rounded-lg border border-gray-200 shadow-sm
              ${dragOverItem === field.id ? 'border-blue-400 bg-blue-50 scale-[1.02] shadow-md ring-2 ring-blue-200' : ''}
              ${draggedItem === field.id ? 'opacity-60 rotate-1 scale-95 shadow-lg' : ''}
              ${!disabled ? 'cursor-move hover:border-gray-300 hover:shadow-md' : ''}
              transition-all duration-200 ease-in-out transform
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Drag Handle & Priority */}
              <div className="flex items-center space-x-2 mt-1">
                {!disabled && (
                  <div className="group">
                    <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Hash className="w-3 h-3 text-gray-400" />
                  {editingPriority === field.id ? (
                    <input
                      type="number"
                      value={tempPriority}
                      onChange={(e) => setTempPriority(e.target.value)}
                      onBlur={() => handlePrioritySubmit(field.id)}
                      onKeyDown={(e) => handlePriorityKeyDown(e, field.id)}
                      className="w-8 h-5 text-xs font-mono text-center border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max={fields.length}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePriorityClick(field.id, field.priority)}
                      disabled={disabled}
                      className="text-xs font-mono text-gray-600 min-w-[1.5rem] text-center hover:bg-gray-100 hover:text-gray-800 px-1 py-0.5 rounded transition-colors"
                      title="Click to edit priority"
                    >
                      {field.priority}
                    </button>
                  )}
                </div>
              </div>

              {/* Field Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getElementTypeIcon(field.elementType)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{field.label}</div>
                      <div className="text-xs text-gray-500">
                        {getElementTypeLabel(field.elementType)}
                        {field.placeholder && ` • ${field.placeholder}`}
                      </div>
                    </div>
                  </div>

                  {/* Enable/Disable Toggle */}
                  <button
                    type="button"
                    onClick={() => onUpdateField(field.id, { enabled: !field.enabled })}
                    disabled={disabled}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-all p-1 rounded hover:bg-gray-50"
                  >
                    {field.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 text-xs font-medium">On</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-xs">Off</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Text Input */}
                <div className="space-y-1">
                  <textarea
                    value={field.text}
                    onChange={(e) => onUpdateField(field.id, { text: e.target.value })}
                    placeholder="Text to type into this field..."
                    className="w-full h-14 px-3 py-2 text-sm border border-gray-200 rounded-md
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent
                             transition-all duration-200 resize-none
                             disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={disabled || !field.enabled}
                  />

                  {/* Character Count & Selector Info */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{field.text.length} characters</span>
                    <span className="text-xs text-gray-400 font-mono truncate max-w-[150px]">
                      {field.selector}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Type className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No fields detected yet.</p>
          <p className="text-xs">Click "Scan Page" to detect input fields.</p>
        </div>
      )}

      {/* Enhanced Drag and Drop Instructions */}
      {fields.length > 1 && !disabled && (
        <div className="text-xs text-gray-500 text-center py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <GripVertical className="w-3 h-3" />
              <span>Drag to reorder • Click priority # to edit</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldList;
