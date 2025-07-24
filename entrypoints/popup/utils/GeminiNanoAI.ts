import type { DetectedField } from '../types';

interface AISession {
  prompt: (input: string) => Promise<string>;
  destroy?: () => void;
}

interface AICapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

// Extended window interface for Chrome's AI API
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        capabilities: () => Promise<AICapabilities>;
        create: (options?: {
          temperature?: number;
          topK?: number;
        }) => Promise<AISession>;
      };
    };
  }
}

export class GeminiNanoAI {
  private session: AISession | null = null;
  private temperature: number;

  constructor(temperature: number = 0.7) {
    this.temperature = Math.max(0.1, Math.min(1.0, temperature));
  }

  /**
   * Check if AI is available in the current environment
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!window.ai?.languageModel) {
        return false;
      }

      const capabilities = await window.ai.languageModel.capabilities();
      return capabilities.available === 'readily' || capabilities.available === 'after-download';
    } catch (error) {
      console.warn('AI availability check failed:', error);
      return false;
    }
  }

  /**
   * Initialize AI session
   */
  async initialize(): Promise<void> {
    if (!await this.isAvailable()) {
      throw new Error('AI is not available in this environment');
    }

    try {
      this.session = await window.ai!.languageModel!.create({
        temperature: this.temperature,
        topK: 3,
      });
    } catch (error) {
      console.error('Failed to initialize AI session:', error);
      throw new Error('Failed to initialize AI session');
    }
  }

  /**
   * Generate content for a specific field
   */
  async generateFieldContent(field: DetectedField): Promise<string> {
    if (!this.session) {
      await this.initialize();
    }

    const prompt = this.buildFieldPrompt(field);
    
    try {
      const response = await this.session!.prompt(prompt);
      return this.cleanResponse(response, field);
    } catch (error) {
      console.error('AI content generation failed:', error);
      throw new Error('Failed to generate content for field');
    }
  }

  /**
   * Generate content for multiple fields
   */
  async fillAllFields(fields: DetectedField[]): Promise<DetectedField[]> {
    const enabledFields = fields.filter(field => field.enabled);
    const updatedFields = [...fields];

    for (const field of enabledFields) {
      try {
        const content = await this.generateFieldContent(field);
        const fieldIndex = updatedFields.findIndex(f => f.id === field.id);
        if (fieldIndex !== -1) {
          updatedFields[fieldIndex] = { ...field, text: content };
        }
      } catch (error) {
        console.warn(`Failed to generate content for field ${field.label}:`, error);
        // Continue with other fields even if one fails
      }
    }

    return updatedFields;
  }

  /**
   * Build a contextual prompt for field content generation
   */
  private buildFieldPrompt(field: DetectedField): string {
    const { label, name, type, placeholder, elementType, formContext, fieldContext } = field;

    let prompt = 'Generate appropriate content for a form field with the following details:\n\n';
    
    // Field identification
    prompt += `Field Label: "${label}"\n`;
    if (name) prompt += `Field Name: "${name}"\n`;
    if (type) prompt += `Input Type: "${type}"\n`;
    if (placeholder) prompt += `Placeholder: "${placeholder}"\n`;
    prompt += `Element Type: ${elementType}\n`;

    // Context information
    if (formContext) prompt += `Form Context: ${formContext}\n`;
    if (fieldContext) prompt += `Field Context: ${fieldContext}\n`;

    // Generation guidelines based on field type and characteristics
    prompt += '\nGeneration Guidelines:\n';
    
    if (type === 'email' || label.toLowerCase().includes('email') || name?.toLowerCase().includes('email')) {
      prompt += '- Generate a realistic email address\n';
    } else if (type === 'tel' || label.toLowerCase().includes('phone') || name?.toLowerCase().includes('phone')) {
      prompt += '- Generate a realistic phone number\n';
    } else if (label.toLowerCase().includes('name') || name?.toLowerCase().includes('name')) {
      if (label.toLowerCase().includes('first') || label.toLowerCase().includes('given')) {
        prompt += '- Generate a realistic first name\n';
      } else if (label.toLowerCase().includes('last') || label.toLowerCase().includes('family') || label.toLowerCase().includes('surname')) {
        prompt += '- Generate a realistic last name\n';
      } else {
        prompt += '- Generate a realistic full name\n';
      }
    } else if (label.toLowerCase().includes('address') || name?.toLowerCase().includes('address')) {
      prompt += '- Generate a realistic street address\n';
    } else if (label.toLowerCase().includes('city') || name?.toLowerCase().includes('city')) {
      prompt += '- Generate a realistic city name\n';
    } else if (label.toLowerCase().includes('state') || label.toLowerCase().includes('province') || name?.toLowerCase().includes('state')) {
      prompt += '- Generate a realistic state or province\n';
    } else if (label.toLowerCase().includes('zip') || label.toLowerCase().includes('postal') || name?.toLowerCase().includes('zip')) {
      prompt += '- Generate a realistic postal/zip code\n';
    } else if (label.toLowerCase().includes('company') || label.toLowerCase().includes('organization') || name?.toLowerCase().includes('company')) {
      prompt += '- Generate a realistic company or organization name\n';
    } else if (type === 'date' || label.toLowerCase().includes('date') || name?.toLowerCase().includes('date')) {
      prompt += '- Generate a realistic date in appropriate format\n';
    } else if (elementType === 'textarea' || label.toLowerCase().includes('comment') || label.toLowerCase().includes('message') || label.toLowerCase().includes('description')) {
      prompt += '- Generate appropriate longer text content (2-3 sentences)\n';
    } else {
      prompt += '- Generate contextually appropriate content\n';
    }

    prompt += '- Keep content realistic and professional\n';
    prompt += '- Return ONLY the field value, no explanations or quotes\n';
    prompt += '- Ensure content is appropriate for the field type and context\n';

    return prompt;
  }

  /**
   * Clean and validate AI response
   */
  private cleanResponse(response: string, field: DetectedField): string {
    let cleaned = response.trim();
    
    // Remove common AI response artifacts
    cleaned = cleaned.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    cleaned = cleaned.replace(/^Content:\s*/i, ''); // Remove "Content:" prefix
    cleaned = cleaned.replace(/^Answer:\s*/i, ''); // Remove "Answer:" prefix
    cleaned = cleaned.replace(/^Field value:\s*/i, ''); // Remove "Field value:" prefix
    
    // Validate based on field type
    if (field.type === 'email' || field.label.toLowerCase().includes('email')) {
      // Basic email validation
      if (!cleaned.includes('@') || !cleaned.includes('.')) {
        return 'user@example.com'; // Fallback
      }
    }
    
    if (field.type === 'tel' || field.label.toLowerCase().includes('phone')) {
      // Ensure phone number format
      cleaned = cleaned.replace(/[^\d\-\(\)\+\s]/g, '');
      if (cleaned.length < 10) {
        return '(555) 123-4567'; // Fallback
      }
    }

    // Length limits based on element type
    if (field.elementType === 'input' && cleaned.length > 100) {
      cleaned = cleaned.substring(0, 100);
    } else if (field.elementType === 'textarea' && cleaned.length > 500) {
      cleaned = cleaned.substring(0, 500);
    }

    return cleaned;
  }

  /**
   * Update temperature setting
   */
  setTemperature(temperature: number): void {
    this.temperature = Math.max(0.1, Math.min(1.0, temperature));
    // Note: This will take effect on next session initialization
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.session?.destroy) {
      this.session.destroy();
    }
    this.session = null;
  }
}

export default GeminiNanoAI;