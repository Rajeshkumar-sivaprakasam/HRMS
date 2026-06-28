import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Select } from './Select';

const options = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
];

const groupedOptions = [
  { value: 'react', label: 'React', group: 'Frontend' },
  { value: 'vue', label: 'Vue', group: 'Frontend' },
  { value: 'node', label: 'Node.js', group: 'Backend' },
  { value: 'deno', label: 'Deno', group: 'Backend' },
];

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = { args: { label: 'Framework', options, placeholder: 'Choose a framework' } };
export const WithValue: Story = { args: { label: 'Framework', options, value: 'react' } };
export const Searchable: Story = { args: { label: 'Framework', options, searchable: true, placeholder: 'Search frameworks...' } };
export const Multi: Story = { args: { label: 'Frameworks', options, multiple: true, value: ['react', 'vue'] } };
export const Clearable: Story = { args: { label: 'Framework', options, clearable: true, value: 'react' } };
export const Grouped: Story = { args: { label: 'Technology', options: groupedOptions } };
export const WithError: Story = { args: { label: 'Framework', options, error: 'Selection is required' } };
export const Disabled: Story = { args: { label: 'Framework', options, disabled: true, value: 'react' } };

export const ClickInteraction: Story = {
  args: { label: 'Test', options, placeholder: 'Select...' },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    await expect(canvas.getByRole('listbox')).toBeInTheDocument();
  },
};
