import { useState } from 'react';
import { GripVertical, ToggleLeft, ToggleRight, Hash, Type } from 'lucide-react';
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

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedItem(fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(fieldId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (!draggedItem || draggedItem === targetFieldId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = fields.findIndex(f => f.id === draggedItem);
    const targetIndex = fields.findIndex(f => f.id === targetFieldId);
    
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

  const getElementTypeIcon = (type: DetectedField['elementType']) => {
    switch (type) {
      case 'textarea':
        return '📝';
      case 'contenteditable':
        return '✏️';
      default:
        return '📝';
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

      <div className="max-h-96 overflow-y-auto space-y-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, field.id)}
            onDragOver={(e) => handleDragOver(e, field.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, field.id)}
            className={`
              p-3 bg-white rounded-lg border border-gray-200 shadow-sm
              ${dragOverItem === field.id ? 'border-blue-300 bg-blue-50' : ''}
              ${draggedItem === field.id ? 'opacity-50' : ''}
              ${!disabled ? 'cursor-move' : ''}
              transition-all duration-200
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Drag Handle & Priority */}
              <div className="flex items-center space-x-2 mt-1">
                {!disabled && (
                  <GripVertical className="w-4 h-4 text-gray-400" />
                )}
                <div className="flex items-center space-x-1">
                  <Hash className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-mono text-gray-600">
                    {field.priority}
                  </span>
                </div>
              </div>

              {/* Field Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getElementTypeIcon(field.elementType)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {field.label}
                      </div>
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
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {field.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Text Input */}
                <textarea
                  value={field.text}
                  onChange={(e) => onUpdateField(field.id, { text: e.target.value })}
                  placeholder="Text to type into this field..."
                  className="w-full h-16 px-3 py-2 text-sm border border-gray-200 rounded-md
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           transition-all duration-200 resize-none"
                  disabled={disabled || !field.enabled}
                />

                {/* Character Count */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{field.text.length} characters</span>
                  <span className="text-xs text-gray-400">
                    Selector: {field.selector}
                  </span>
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
    </div>
  );
};

export default FieldList;