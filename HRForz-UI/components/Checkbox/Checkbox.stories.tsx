import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Checkbox, CheckboxGroup } from './Checkbox';

const meta: Meta<typeof Checkbox> = { title: 'Components/Checkbox', component: Checkbox, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = { args: { label: 'Accept terms and conditions' } };
export const Checked: Story = { args: { label: 'I agree', defaultChecked: true } };
export const Indeterminate: Story = { args: { label: 'Select all', indeterminate: true } };
export const Disabled: Story = { args: { label: 'Disabled option', disabled: true } };
export const DisabledChecked: Story = { args: { label: 'Disabled checked', disabled: true, defaultChecked: true } };

export const Group: Story = {
  render: () => (
    <CheckboxGroup label="Select interests" direction="vertical">
      <Checkbox label="Design" defaultChecked />
      <Checkbox label="Development" />
      <Checkbox label="Marketing" />
    </CheckboxGroup>
  ),
};

export const HorizontalGroup: Story = {
  render: () => (
    <CheckboxGroup label="Horizontal" direction="horizontal">
      <Checkbox label="A" /><Checkbox label="B" /><Checkbox label="C" />
    </CheckboxGroup>
  ),
};

export const ClickInteraction: Story = {
  args: { label: 'Click me' },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole('checkbox');
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};
