import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tooltip } from './Tooltip';
import { Button } from '../Button/Button';

const meta: Meta<typeof Tooltip> = { title: 'Components/Tooltip', component: Tooltip, tags: ['autodocs'],
  argTypes: { position: { control: 'select', options: ['top', 'bottom', 'left', 'right'] } } };
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Top: Story = { render: () => <div style={{ padding: '60px' }}><Tooltip content="Top tooltip" position="top"><Button>Hover me</Button></Tooltip></div> };
export const Bottom: Story = { render: () => <div style={{ padding: '60px' }}><Tooltip content="Bottom tooltip" position="bottom"><Button>Hover me</Button></Tooltip></div> };
export const Left: Story = { render: () => <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><Tooltip content="Left tooltip" position="left"><Button>Hover me</Button></Tooltip></div> };
export const Right: Story = { render: () => <div style={{ padding: '60px' }}><Tooltip content="Right tooltip" position="right"><Button>Hover me</Button></Tooltip></div> };

export const AllPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '40px', padding: '60px', justifyContent: 'center' }}>
      {(['top', 'bottom', 'left', 'right'] as const).map(p => (
        <Tooltip key={p} content={`${p} tooltip`} position={p}><Button variant="secondary">{p}</Button></Tooltip>
      ))}
    </div>
  ),
};
