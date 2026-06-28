import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'search'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { label: 'Email', placeholder: 'Enter your email', type: 'email' } };
export const WithHelperText: Story = { args: { label: 'Username', helperText: 'Must be at least 3 characters', placeholder: 'Choose a username' } };
export const WithError: Story = { args: { label: 'Email', error: 'Please enter a valid email address', placeholder: 'Enter your email', value: 'invalid' } };
export const Password: Story = { args: { label: 'Password', type: 'password', placeholder: 'Enter password' } };
export const Disabled: Story = { args: { label: 'Disabled', disabled: true, value: 'Cannot edit' } };
export const Required: Story = { args: { label: 'Full Name', required: true, placeholder: 'Enter your name' } };

export const WithPrefix: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    prefix: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <Input label="Small" size="sm" placeholder="Small input" />
      <Input label="Medium" size="md" placeholder="Medium input" />
      <Input label="Large" size="lg" placeholder="Large input" />
    </div>
  ),
};

export const ClickInteraction: Story = {
  args: { label: 'Test', placeholder: 'Type here' },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'Hello World');
    await expect(input).toHaveValue('Hello World');
  },
};
