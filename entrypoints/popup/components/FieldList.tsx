import { GripVertical, Hash, Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { cn } from '../lib/utils';
import type { DetectedField } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

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
    const newPriority = Number.parseInt(tempPriority, 10);

    if (isNaN(newPriority) || newPriority < 1 || newPriority > fields.length) {
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

  return (
    <Card className="h-full rounded-none border-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Type className="w-4 h-4 text-primary" />
          <span>Detected Fields</span>
          <Badge variant="outline">({fields.length})</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[300px]">
          <div className="p-3 space-y-3">
            {fields.map((field, index) => (
              <Card
                key={field.id}
                draggable={!disabled}
                onDragStart={(e) => handleDragStart(e, field.id)}
                onDragOver={(e) => handleDragOver(e, field.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, field.id)}
                onDragEnd={handleDragEnd}
                className={`
                  transition-all duration-200 ease-in-out transform
                  ${dragOverItem === field.id ? 'border-primary bg-accent scale-[1.01] shadow-md ring-1 ring-primary/20' : ''}
                  ${draggedItem === field.id ? 'opacity-60 rotate-1 scale-95 shadow-lg' : ''}
                  ${!disabled ? 'cursor-move hover:border-primary/50 hover:shadow-md' : ''}
                `}
              >
                <CardContent className="p-3">
                  {/* Compact Header Row */}
                  <div className="flex items-center space-x-2 mb-2">
                    {/* Drag Handle & Priority */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {!disabled && <GripVertical className="w-3 h-3 text-muted-foreground" />}
                      <div className="flex items-center space-x-1">
                        <Hash className="w-3 h-3 text-muted-foreground" />
                        {editingPriority === field.id ? (
                          <Input
                            type="number"
                            value={tempPriority}
                            onChange={(e) => setTempPriority(e.target.value)}
                            onBlur={() => handlePrioritySubmit(field.id)}
                            onKeyDown={(e) => handlePriorityKeyDown(e, field.id)}
                            className="w-8 h-6 text-xs text-center p-1"
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
                            className="h-6 w-6 p-0 text-xs font-mono hover:bg-accent"
                            title="Click to edit priority"
                          >
                            {field.priority}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Field Type & Label */}
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getElementTypeLabel(field.elementType)}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{field.label}</div>
                        {field.placeholder && (
                          <div className="text-xs text-muted-foreground truncate">
                            {field.placeholder}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <Switch
                        checked={field.enabled}
                        onCheckedChange={(checked) => onUpdateField(field.id, { enabled: checked })}
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  {/* Text Input */}
                  <div className="space-y-2">
                    <Textarea
                      value={field.text}
                      onChange={(e) => onUpdateField(field.id, { text: e.target.value })}
                      placeholder="Text to type into this field..."
                      className="min-h-[2.5rem] text-sm resize-none"
                      disabled={disabled || !field.enabled}
                    />

                    {/* Character Count & Selector Info */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {field.text.length} chars
                      </Badge>
                      <span className="font-mono truncate max-w-[150px]">
                        {field.selector}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {fields.length === 0 && (
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <Type className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-foreground">No fields detected yet.</p>
            <p className="text-xs text-muted-foreground">Click "Scan Page" to detect input fields.</p>
          </div>
        </CardContent>
      )}

      {/* Enhanced Drag and Drop Instructions */}
      {fields.length > 1 && !disabled && (
        <div className="text-xs text-muted-foreground text-center py-2 border-t bg-muted/30">
          <div className="flex items-center justify-center space-x-2">
            <GripVertical className="w-3 h-3" />
            <span>Drag to reorder • Click # to edit priority</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default FieldList;
