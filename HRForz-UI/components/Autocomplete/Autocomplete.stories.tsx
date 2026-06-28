import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Autocomplete } from './Autocomplete';

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
  { value: 'next', label: 'Next.js' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
];

const groupedOptions = [
  { value: 'react', label: 'React', group: 'Frontend' },
  { value: 'vue', label: 'Vue', group: 'Frontend' },
  { value: 'angular', label: 'Angular', group: 'Frontend' },
  { value: 'node', label: 'Node.js', group: 'Backend' },
  { value: 'deno', label: 'Deno', group: 'Backend' },
  { value: 'bun', label: 'Bun', group: 'Backend' },
];

const meta: Meta<typeof Autocomplete> = {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Autocomplete>;

// Stateful wrapper so selections are visibly reflected in all stories
function Single(props: Partial<React.ComponentProps<typeof Autocomplete>>) {
  const [val, setVal] = useState<string>('');
  return (
    <div style={{ maxWidth: 320 }}>
      <Autocomplete
        options={frameworks}
        value={val}
        onChange={(v) => setVal(v as string)}
        {...props}
      />
      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>
        Value: <strong>{val || '—'}</strong>
      </p>
    </div>
  );
}

function Multi(props: Partial<React.ComponentProps<typeof Autocomplete>>) {
  const [vals, setVals] = useState<string[]>([]);
  return (
    <div style={{ maxWidth: 400 }}>
      <Autocomplete
        options={frameworks}
        multiple
        value={vals}
        onChange={(v) => setVals(v as string[])}
        {...props}
      />
      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>
        Values: <strong>{vals.join(', ') || '—'}</strong>
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => <Single label="Framework" placeholder="Type to search..." />,
};

export const WithPreselectedValue: Story = {
  render: () => {
    const [val, setVal] = useState('react');
    return (
      <div style={{ maxWidth: 320 }}>
        <Autocomplete label="Framework" options={frameworks} value={val} onChange={(v) => setVal(v as string)} />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>Value: <strong>{val}</strong></p>
      </div>
    );
  },
};

export const Clearable: Story = {
  render: () => <Single label="Framework" clearable placeholder="Type to search..." />,
};

export const MultiSelect: Story = {
  render: () => {
    const [vals, setVals] = useState(['react', 'vue']);
    return (
      <div style={{ maxWidth: 420 }}>
        <Autocomplete
          label="Frameworks"
          options={frameworks}
          multiple
          clearable
          value={vals}
          onChange={(v) => setVals(v as string[])}
          placeholder="Add frameworks..."
        />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>
          Values: <strong>{vals.join(', ') || '—'}</strong>
        </p>
      </div>
    );
  },
};

export const MultiEmpty: Story = {
  render: () => <Multi label="Frameworks" clearable placeholder="Add frameworks..." />,
};

export const Grouped: Story = {
  render: () => {
    const [val, setVal] = useState('');
    return (
      <div style={{ maxWidth: 320 }}>
        <Autocomplete
          label="Technology"
          options={groupedOptions}
          value={val}
          onChange={(v) => setVal(v as string)}
          placeholder="Search technologies..."
        />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>Value: <strong>{val || '—'}</strong></p>
      </div>
    );
  },
};

export const AllowCustomValue: Story = {
  render: () => <Single label="Tag" allowCustomValue placeholder="Type or select..." helperText="Press Enter to add a custom value" />,
};

export const WithFetchUrl: Story = {
  render: () => {
    const [val, setVal] = useState('');
    return (
      <div style={{ maxWidth: 320 }}>
        <Autocomplete
          label="GitHub User"
          options={[]}
          value={val}
          onChange={(v) => setVal(v as string)}
          fetchUrl={(q) => `https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=6`}
          filterOption={() => true}
          noOptionsText="Type to search GitHub users..."
          placeholder="Search GitHub users..."
          // Map GitHub API response: response.data shape expected as { value, label }[]
          // Use a custom fetchUrl function that returns items already in that shape
        />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6 }}>
          Note: GitHub API returns <code>{'{ data: [...] }'}</code> — set up a proxy for production.
        </p>
      </div>
    );
  },
};

export const WithError: Story = {
  render: () => <Single label="Framework" error="Please select a framework" />,
};

export const WithHelperText: Story = {
  render: () => <Single label="Framework" helperText="Choose your preferred framework" />,
};

export const Disabled: Story = {
  render: () => {
    const [val] = useState('react');
    return (
      <div style={{ maxWidth: 320 }}>
        <Autocomplete label="Framework" options={frameworks} value={val} disabled onChange={() => {}} />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Autocomplete label="Search" options={[]} loading placeholder="Searching..." onChange={() => {}} />
    </div>
  ),
};

export const TypeToFilter: Story = {
  render: () => <Single label="Filter demo" placeholder="Type 're' to filter..." />,
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await userEvent.type(input, 're');
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
    await expect(canvas.getByText('React')).toBeInTheDocument();
  },
};
