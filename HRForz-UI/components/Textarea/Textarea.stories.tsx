import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = { args: { label: 'Message', placeholder: 'Type your message...' } };
export const WithHelperText: Story = { args: { label: 'Bio', helperText: 'Tell us about yourself', placeholder: 'Your bio...' } };
export const WithError: Story = { args: { label: 'Description', error: 'Description is required', value: '' } };
export const WithCharCount: Story = { args: { label: 'Comment', showCharCount: true, maxLength: 200, value: 'Hello world', placeholder: 'Write a comment...' } };
export const AutoResize: Story = { args: { label: 'Auto-resize', autoResize: true, placeholder: 'This textarea grows as you type...' } };
export const Disabled: Story = { args: { label: 'Disabled', disabled: true, value: 'Cannot edit this' } };

export const ClickInteraction: Story = {
  args: { label: 'Test', placeholder: 'Type here' },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole('textbox');
    await userEvent.type(textarea, 'Hello World');
    await expect(textarea).toHaveValue('Hello World');
  },
};
