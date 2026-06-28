import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tag } from './Tag';
const meta: Meta<typeof Tag> = { title: 'Components/Tag', component: Tag, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Tag>;
export const Default: Story = { args: { children: 'Tag' } };
export const Primary: Story = { args: { children: 'React', color: 'primary' } };
export const Dismissible: Story = { args: { children: 'Removable', dismissible: true } };
export const Clickable: Story = { args: { children: 'Clickable', clickable: true } };
export const WithIcon: Story = {
  args: { children: 'Star', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
};
export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Tag>Default</Tag><Tag color="primary">Primary</Tag><Tag color="success">Success</Tag><Tag color="error">Error</Tag>
    </div>
  ),
};
