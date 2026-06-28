import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Toast } from './Toast';
const meta: Meta<typeof Toast> = { title: 'Components/Toast', component: Toast, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Toast>;
export const Default: Story = { args: { message: 'This is a toast notification.', variant: 'info' } };
export const Success: Story = { args: { title: 'Saved!', message: 'Your changes have been saved.', variant: 'success' } };
export const Error: Story = { args: { title: 'Error', message: 'Something went wrong.', variant: 'error' } };
export const Warning: Story = { args: { title: 'Warning', message: 'Your session is about to expire.', variant: 'warning' } };
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px' }}>
      <Toast variant="info" title="Info" message="Informational notification." />
      <Toast variant="success" title="Success" message="Operation completed." />
      <Toast variant="warning" title="Warning" message="Proceed carefully." />
      <Toast variant="error" title="Error" message="An error occurred." />
    </div>
  ),
};
