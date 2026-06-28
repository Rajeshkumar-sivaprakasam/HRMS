import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Accordion } from './Accordion';

const items = [
  { id: '1', title: 'What is this component library?', content: 'A production-ready set of React components built with Next.js, TypeScript, and SCSS Modules.' },
  { id: '2', title: 'How do I install it?', content: 'Clone the repository and run npm install. All components are ready to use.' },
  { id: '3', title: 'Is it accessible?', content: 'Yes! Every component follows WAI-ARIA patterns and is keyboard navigable.' },
  { id: '4', title: 'Can I customize the theme?', content: 'All design tokens are defined in styles/variables.scss. Update the variables to match your brand.' },
];

const meta: Meta<typeof Accordion> = { title: 'Components/Accordion', component: Accordion, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = { args: { items } };
export const DefaultOpen: Story = { args: { items, defaultOpen: ['1'] } };
export const MultiExpand: Story = { args: { items, multiple: true, defaultOpen: ['1', '2'] } };

export const ClickInteraction: Story = {
  args: { items },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /What is this component library/i });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};
