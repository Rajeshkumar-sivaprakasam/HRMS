import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React, { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from '../Button/Button';

const meta: Meta<typeof Drawer> = { title: 'Components/Drawer', component: Drawer, tags: ['autodocs'],
  argTypes: { position: { control: 'select', options: ['left', 'right', 'bottom'] } } };
export default meta;
type Story = StoryObj<typeof Drawer>;

const DrawerDemo = (props: Partial<React.ComponentProps<typeof Drawer>>) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Drawer</Button>
      <Drawer isOpen={open} onClose={() => setOpen(false)} title="Drawer Title" {...props}>
        <p>This is drawer content. You can place navigation, forms, or details here.</p>
      </Drawer>
    </>
  );
};

export const Right: Story = { render: () => <DrawerDemo position="right" /> };
export const Left: Story = { render: () => <DrawerDemo position="left" /> };
export const Bottom: Story = { render: () => <DrawerDemo position="bottom" /> };
