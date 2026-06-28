import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Navbar } from './Navbar';
import { Button } from '../Button/Button';

const links = [
  { label: 'Home', href: '#', active: true },
  { label: 'Products', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'About', href: '#' },
];

const meta: Meta<typeof Navbar> = { title: 'Components/Navbar', component: Navbar, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  args: {
    logo: <span style={{ fontWeight: 700, fontSize: '18px' }}>🧩 CompLib</span>,
    links,
    actions: <Button size="sm">Sign Up</Button>,
  },
};

export const MinimalNavbar: Story = {
  args: {
    logo: <span style={{ fontWeight: 700, fontSize: '18px' }}>Brand</span>,
    links: [{ label: 'Docs', href: '#' }, { label: 'Blog', href: '#' }],
  },
};
