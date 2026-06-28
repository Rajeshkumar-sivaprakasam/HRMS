import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading, Text, Code, Blockquote, Lead } from './Typography';

const meta: Meta<typeof Heading> = { title: 'Components/Typography', component: Heading, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Heading>;

export const Headings: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Heading level="h1">Heading 1</Heading>
      <Heading level="h2">Heading 2</Heading>
      <Heading level="h3">Heading 3</Heading>
      <Heading level="h4">Heading 4</Heading>
      <Heading level="h5">Heading 5</Heading>
      <Heading level="h6">Heading 6</Heading>
    </div>
  ),
};

export const GradientHeading: Story = {
  render: () => <Heading level="h1" gradient>Gradient Heading</Heading>,
};

export const TextVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Text variant="body1">Body 1 — Default body text with relaxed line height for readability.</Text>
      <Text variant="body2">Body 2 — Smaller body text for secondary content.</Text>
      <Text variant="caption">Caption — Small text for metadata and labels.</Text>
      <Text variant="overline">Overline — Uppercased category or label text.</Text>
    </div>
  ),
};

export const InlineCode: Story = {
  render: () => <Text>Use the <Code>npm install</Code> command to install dependencies.</Text>,
};

export const BlockquoteStory: Story = {
  name: 'Blockquote',
  render: () => <Blockquote>The best way to predict the future is to create it. — Peter Drucker</Blockquote>,
};

export const LeadText: Story = {
  render: () => <Lead>A production-ready React component library built with Next.js, TypeScript, and SCSS Modules.</Lead>,
};

export const TruncatedText: Story = {
  render: () => (
    <div style={{ maxWidth: '300px' }}>
      <Text truncate>This is a very long text that should be truncated with an ellipsis when it overflows its container.</Text>
    </div>
  ),
};

export const ClampedText: Story = {
  render: () => (
    <div style={{ maxWidth: '300px' }}>
      <Text clamp={2}>This is a multi-line text that will be clamped to two lines. Extra content beyond the second line will be hidden with an ellipsis indicator.</Text>
    </div>
  ),
};
