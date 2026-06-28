import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from './Badge';
const meta: Meta<typeof Badge> = { title: 'Components/Badge', component: Badge, tags: ['autodocs'],
  argTypes: { variant: { control: 'select', options: ['solid','outline','subtle'] }, color: { control: 'select', options: ['neutral','success','warning','error','info','primary'] }, size: { control: 'select', options: ['sm','md','lg'] } } };
export default meta;
type Story = StoryObj<typeof Badge>;
export const Default: Story = { args: { children: 'Badge' } };
export const Solid: Story = { args: { children: 'Active', variant: 'solid', color: 'success' } };
export const Outline: Story = { args: { children: 'Pending', variant: 'outline', color: 'warning' } };
export const WithDot: Story = { args: { children: 'Online', dot: true, color: 'success' } };
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {(['success','warning','error','info','primary','neutral'] as const).map(c => <Badge key={c} color={c} variant="subtle">{c}</Badge>)}
    </div>
  ),
};
export const AllStyles: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {(['solid','outline','subtle'] as const).map(v => <Badge key={v} variant={v} color="primary">{v}</Badge>)}
    </div>
  ),
};
