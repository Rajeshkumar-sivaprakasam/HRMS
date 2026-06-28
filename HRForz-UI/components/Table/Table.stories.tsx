import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Table } from './Table';

const columns = [
  { id: 'name', header: 'Name', accessor: 'name' as const, sortable: true },
  { id: 'email', header: 'Email', accessor: 'email' as const, sortable: true },
  { id: 'role', header: 'Role', accessor: 'role' as const },
  { id: 'status', header: 'Status', accessor: 'status' as const, sortable: true },
];

const data = [
  { name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' },
  { name: 'Carol Williams', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' },
  { name: 'Dave Brown', email: 'dave@example.com', role: 'Editor', status: 'Active' },
  { name: 'Eve Davis', email: 'eve@example.com', role: 'Admin', status: 'Active' },
];

const meta: Meta<typeof Table> = { title: 'Components/Table', component: Table, tags: ['autodocs'] };
export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = { args: { columns, data } };
export const Striped: Story = { args: { columns, data, striped: true } };
export const Selectable: Story = { args: { columns, data, selectable: true } };
export const Empty: Story = { args: { columns, data: [] } };
