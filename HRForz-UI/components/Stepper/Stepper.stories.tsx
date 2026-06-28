import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stepper } from './Stepper';

const steps = [
  { title: 'Personal Info', description: 'Provide your basic details' },
  { title: 'Address', description: 'Where do you live?' },
  { title: 'Payment', description: 'Add your credit card' },
  { title: 'Review', description: 'Check your order' },
];

const meta: Meta<typeof Stepper> = {
  title: 'Components/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] }
  }
};
export default meta;
type Story = StoryObj<typeof Stepper>;

export const Horizontal: Story = { args: { steps, activeStep: 1, orientation: 'horizontal' } };
export const Vertical: Story = { args: { steps, activeStep: 2, orientation: 'vertical' } };

export const WithError: Story = {
  args: {
    steps: [
      { title: 'Step 1', status: 'complete' },
      { title: 'Step 2', status: 'error', description: 'Payment failed' },
      { title: 'Step 3', status: 'pending' },
    ]
  }
};
