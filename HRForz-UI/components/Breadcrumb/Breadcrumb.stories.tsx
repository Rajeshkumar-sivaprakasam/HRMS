import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Breadcrumb } from './Breadcrumb';
const meta: Meta<typeof Breadcrumb> = { title: 'Components/Breadcrumb', component: Breadcrumb, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Breadcrumb>;
export const Default: Story = { args: { items: [{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Widget Pro' }] } };
export const Truncated: Story = { args: { items: [{ label: 'Home', href: '/' }, { label: 'Very Long Category Name That Gets Truncated', href: '#' }, { label: 'Current Page' }], truncate: true } };
export const CustomSeparator: Story = { args: { items: [{ label: 'Home', href: '/' }, { label: 'About', href: '#' }, { label: 'Team' }], separator: '/' } };
