import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = { 
  title: 'Components/Skeleton', 
  component: Skeleton, 
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['text', 'avatar', 'card', 'row'] }
  }
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = { args: { variant: 'text', width: '100%' } };
export const Avatar: Story = { args: { variant: 'avatar', width: 48, height: 48 } };
export const Card: Story = { args: { variant: 'card', width: 300 } };

export const Composition: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', maxWidth: '400px' }}>
      <Skeleton variant="avatar" width={48} height={48} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  ),
};
