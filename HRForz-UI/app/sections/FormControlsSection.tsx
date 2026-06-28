'use client';
import React, { useState } from 'react';
import { Button, Input, Textarea, Select, Autocomplete, Checkbox, Radio, Toggle } from '@/components';

const frameworkOptions = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
  { value: 'next', label: 'Next.js' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
];

export default function FormControlsSection() {
  const [acSingle, setAcSingle] = useState('');
  const [acMulti, setAcMulti] = useState<string[]>([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="ghost">Outline Button</Button>
        <Button variant="danger">Danger Button</Button>
      </div>
      <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Email Address" placeholder="you@example.com" />
        <Textarea label="Message" placeholder="Type your message here..." />
        <Select label="Country" options={[{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }]} />
        <Autocomplete
          label="Framework (single)"
          options={frameworkOptions}
          value={acSingle}
          onChange={(v) => setAcSingle(v as string)}
          clearable
          placeholder="Type to search..."
          helperText={acSingle ? `Selected: ${acSingle}` : undefined}
        />
        <Autocomplete
          label="Frameworks (multi)"
          options={frameworkOptions}
          multiple
          clearable
          value={acMulti}
          onChange={(v) => setAcMulti(v as string[])}
          placeholder="Add frameworks..."
          helperText={acMulti.length ? `Selected: ${acMulti.join(', ')}` : undefined}
        />
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Checkbox label="Accept terms" />
          <Radio label="Option 1" name="radio-group" value="1" />
          <Toggle label="Enable feature" />
        </div>
      </div>
    </div>
  );
}
