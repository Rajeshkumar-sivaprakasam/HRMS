import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Popover } from './Popover';
import { Button } from '../Button/Button';

const meta: Meta<typeof Popover> = { title: 'Components/Popover', component: Popover, tags: ['autodocs'],
  argTypes: { trigger: { control: 'select', options: ['click', 'hover'] }, position: { control: 'select', options: ['top', 'bottom', 'left', 'right'] } } };
export default meta;
type Story = StoryObj<typeof Popover>;

export const Click: Story = {
  render: () => (
    <div style={{ padding: '100px' }}>
      <Popover trigger="click" content={<div><strong>Popover Title</strong><p style={{ marginTop: '8px', fontSize: '14px', color: '#64748B' }}>This is a popover with rich content.</p></div>}>
        <Button>Click me</Button>
      </Popover>
    </div>
  ),
};

export const Hover: Story = {
  render: () => (
    <div style={{ padding: '100px' }}>
      <Popover trigger="hover" position="top" content={<p style={{ fontSize: '14px' }}>Hovering shows the popover.</p>}>
        <Button variant="secondary">Hover me</Button>
      </Popover>
    </div>
  ),
};
