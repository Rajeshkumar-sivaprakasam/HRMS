import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'fullscreen'] },
  },
};
export default meta;
type Story = StoryObj<typeof Modal>;

const ModalDemo = (props: Partial<React.ComponentProps<typeof Modal>>) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Modal Title"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </>
        }
        {...props}
      >
        <p>This is the modal body content. You can put any content here.</p>
      </Modal>
    </>
  );
};

export const Default: Story = { render: () => <ModalDemo /> };
export const Small: Story = { render: () => <ModalDemo size="sm" /> };
export const Large: Story = { render: () => <ModalDemo size="lg" /> };
export const Fullscreen: Story = { render: () => <ModalDemo size="fullscreen" /> };

export const LongContent: Story = {
  render: () => (
    <ModalDemo>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} style={{ marginBottom: '16px' }}>
          Paragraph {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      ))}
    </ModalDemo>
  ),
};

export const ClickInteraction: Story = {
  render: () => <ModalDemo />,
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Open Modal' });
    await userEvent.click(trigger);
    // Modal is rendered in a portal, so query from document body
    await expect(document.querySelector('[data-testid="modal"]')).toBeTruthy();
  },
};
