import { describe, expect, it } from 'vitest';
import type { DetectedField } from '../types';
import { LOCAL_DEMO_TEXTS, localFillFields } from './sample-data';

const makeField = (overrides: Partial<DetectedField>): DetectedField => ({
  id: 'field-1',
  scanToken: 'token',
  priority: 1,
  label: 'Field 1',
  text: '',
  enabled: true,
  selector: '#field-1',
  elementType: 'input',
  ...overrides,
});

describe('localFillFields', () => {
  it('fills every enabled field with non-empty text', () => {
    const fields = [
      makeField({ id: 'field-1', label: 'First name' }),
      makeField({ id: 'field-2', label: 'Notes', elementType: 'textarea' }),
    ];
    const filled = localFillFields(fields);
    expect(filled).toHaveLength(2);
    for (const field of filled) {
      expect(field.text.length).toBeGreaterThan(0);
    }
  });

  it('leaves disabled fields untouched', () => {
    const fields = [makeField({ id: 'field-1', enabled: false, text: 'keep me' })];
    expect(localFillFields(fields)[0].text).toBe('keep me');
  });

  it('matches field intent from labels and placeholders', () => {
    const [email, phone, city] = localFillFields([
      makeField({ id: 'field-1', label: 'Email address' }),
      makeField({ id: 'field-2', label: 'Phone' }),
      makeField({ id: 'field-3', label: 'City' }),
    ]);
    expect(email.text).toContain('@example.com');
    expect(phone.text).toMatch(/^\+1 555/);
    expect(city.text.length).toBeGreaterThan(0);
  });

  it('does not mutate the input array', () => {
    const fields = [makeField({ id: 'field-1' })];
    localFillFields(fields);
    expect(fields[0].text).toBe('');
  });
});

describe('LOCAL_DEMO_TEXTS', () => {
  it('provides a non-empty local sample for every preset id', () => {
    // Keep in sync with DEMO_PRESETS in ai.ts.
    for (const id of ['support-reply', 'product-blurb', 'bio', 'email', 'commit']) {
      expect(LOCAL_DEMO_TEXTS[id]).toBeTruthy();
    }
  });
});
