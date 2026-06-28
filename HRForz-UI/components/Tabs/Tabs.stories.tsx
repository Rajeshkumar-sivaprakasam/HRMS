import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tabs } from './Tabs';

const items = [
  { id: 'overview', label: 'Overview', content: <p>Overview content goes here.</p> },
  { id: 'features', label: 'Features', content: <p>Features list and descriptions.</p> },
  { id: 'pricing', label: 'Pricing', content: <p>Pricing tiers and comparison.</p> },
  { id: 'faq', label: 'FAQ', content: <p>Frequently asked questions.</p> },
];

const meta: Meta<typeof Tabs> = { title: 'Components/Tabs', component: Tabs, tags: ['autodocs'],
  argTypes: { orientation: { control: 'select', options: ['horizontal', 'vertical'] }, variant: { control: 'select', options: ['underline', 'pills'] } } };
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Underline: Story = { args: { items, variant: 'underline' } };
export const Pills: Story = { args: { items, variant: 'pills' } };
export const Vertical: Story = { args: { items, orientation: 'vertical' } };
export const DefaultActive: Story = { args: { items, activeTab: 'features' } };

export const ClickInteraction: Story = {
  args: { items },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const tab = canvas.getByRole('tab', { name: 'Features' });
    await userEvent.click(tab);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  },
};
