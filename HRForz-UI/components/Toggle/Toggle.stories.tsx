import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = { title: 'Components/Toggle', component: Toggle, tags: ['autodocs'],
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } } };
export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = { args: { label: 'Dark mode' } };
export const Checked: Story = { args: { label: 'Enabled', defaultChecked: true } };
export const Disabled: Story = { args: { label: 'Disabled', disabled: true } };
export const Small: Story = { args: { label: 'Small toggle', size: 'sm' } };
export const Large: Story = { args: { label: 'Large toggle', size: 'lg' } };

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Toggle label="SM" size="sm" /><Toggle label="MD" size="md" defaultChecked /><Toggle label="LG" size="lg" />
    </div>
  ),
};

export const ClickInteraction: Story = {
  args: { label: 'Toggle me' },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('switch');
    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
  },
};
