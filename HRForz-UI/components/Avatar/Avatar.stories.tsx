import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar, AvatarGroup } from './Avatar';
const meta: Meta<typeof Avatar> = { title: 'Components/Avatar', component: Avatar, tags: ['autodocs'], argTypes: { size: { control: 'select', options: ['xs','sm','md','lg','xl'] } } };
export default meta;
type Story = StoryObj<typeof Avatar>;
export const Default: Story = { args: { name: 'John Doe' } };
export const WithImage: Story = { args: { src: 'https://i.pravatar.cc/150?img=1', alt: 'User', name: 'Jane Doe' } };
export const Initials: Story = { args: { name: 'Alice Wonderland' } };
export const Fallback: Story = { args: {} };
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {(['xs','sm','md','lg','xl'] as const).map(s => <Avatar key={s} size={s} name="JD" />)}
    </div>
  ),
};
export const Group: Story = {
  render: () => (
    <AvatarGroup max={3} size="md">
      <Avatar name="Alice B" /><Avatar name="Bob C" /><Avatar name="Carol D" /><Avatar name="Dave E" /><Avatar name="Eve F" />
    </AvatarGroup>
  ),
};
