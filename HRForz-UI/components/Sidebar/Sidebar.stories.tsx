import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Sidebar } from './Sidebar';

const icon = (d: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={d}/></svg>;

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: icon('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), active: true },
  { id: 'users', label: 'Users', icon: icon('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'), children: [
    { id: 'all-users', label: 'All Users', href: '#' },
    { id: 'add-user', label: 'Add User', href: '#' },
  ]},
  { id: 'settings', label: 'Settings', icon: icon('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z') },
  { id: 'reports', label: 'Reports', icon: icon('M18 20V10m-6 10V4M6 20v-6') },
];

const meta: Meta<typeof Sidebar> = { title: 'Components/Sidebar', component: Sidebar, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <div style={{ height: '400px', display: 'flex' }}>
      <Sidebar items={items} logo="CompLib" />
      <div style={{ flex: 1, padding: '24px' }}>Main content area</div>
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div style={{ height: '400px', display: 'flex' }}>
      <Sidebar items={items} logo="CompLib" defaultCollapsed />
      <div style={{ flex: 1, padding: '24px' }}>Main content area</div>
    </div>
  ),
};
