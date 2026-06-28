import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = { args: { value: 60 } };
export const WithLabel: Story = { args: { value: 45, label: 'Uploading files', showValue: true } };
export const Striped: Story = { args: { value: 80, striped: true, label: 'Processing' } };
export const Indeterminate: Story = { args: { indeterminate: true, label: 'Loading data' } };
