import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Alert } from './Alert';
const meta: Meta<typeof Alert> = { title: 'Components/Alert', component: Alert, tags: ['autodocs'], argTypes: { variant: { control: 'select', options: ['info','success','warning','error'] } } };
export default meta;
type Story = StoryObj<typeof Alert>;
export const Default: Story = { args: { children: 'This is an informational alert.', variant: 'info' } };
export const WithTitle: Story = { args: { title: 'Heads up!', children: 'You can add components to your app using the CLI.', variant: 'info' } };
export const Success: Story = { args: { title: 'Success', children: 'Your changes have been saved.', variant: 'success' } };
export const Warning: Story = { args: { title: 'Warning', children: 'Your session is about to expire.', variant: 'warning' } };
export const Error: Story = { args: { title: 'Error', children: 'Something went wrong. Please try again.', variant: 'error' } };
export const Dismissible: Story = { args: { title: 'Dismissible', children: 'Click the X to dismiss.', dismissible: true } };
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Alert variant="info" title="Info">Informational message.</Alert>
      <Alert variant="success" title="Success">Operation completed.</Alert>
      <Alert variant="warning" title="Warning">Proceed with caution.</Alert>
      <Alert variant="error" title="Error">An error occurred.</Alert>
    </div>
  ),
};
