import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Radio, RadioGroup } from './Radio';

const meta: Meta<typeof Radio> = { title: 'Components/Radio', component: Radio, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = { args: { label: 'Option A', name: 'demo' } };
export const Checked: Story = { args: { label: 'Selected', name: 'demo', defaultChecked: true } };
export const Disabled: Story = { args: { label: 'Disabled', name: 'demo', disabled: true } };

export const VerticalGroup: Story = {
  render: () => (
    <RadioGroup label="Choose a plan" name="plan" direction="vertical">
      <Radio label="Free" value="free" defaultChecked />
      <Radio label="Pro" value="pro" />
      <Radio label="Enterprise" value="enterprise" />
    </RadioGroup>
  ),
};

export const HorizontalGroup: Story = {
  render: () => (
    <RadioGroup label="Size" name="size" direction="horizontal">
      <Radio label="S" value="s" /><Radio label="M" value="m" defaultChecked /><Radio label="L" value="l" />
    </RadioGroup>
  ),
};

export const ClickInteraction: Story = {
  args: { label: 'Click me', name: 'test' },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const radio = canvas.getByRole('radio');
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
  },
};
