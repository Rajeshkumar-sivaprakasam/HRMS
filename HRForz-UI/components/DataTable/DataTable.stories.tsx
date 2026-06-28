import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './DataTable';
import type { DataTableColumn, RowAction, StatusState } from './types';

// ─── Shared types ─────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  salary: number;
}

// ─── Sample data ──────────────────────────────────────────────────────────────

const ROLES   = ['Admin', 'Developer', 'Manager', 'Analyst', 'Designer'];
const FIRST   = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
const LAST    = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const STATUSES = ['Active', 'Inactive', 'Pending'] as const;

const USERS: User[] = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  name: `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`,
  email: `${FIRST[i % FIRST.length].toLowerCase()}${i}@example.com`,
  role: ROLES[i % ROLES.length],
  status: STATUSES[i % STATUSES.length],
  joinDate: new Date(2021 + (i % 3), i % 12, (i % 27) + 1).toISOString().split('T')[0],
  salary: 45000 + (i % 10) * 8500,
}));

// ─── Column definitions ───────────────────────────────────────────────────────

const STATUS_RESOLVER = (v: unknown): StatusState => {
  if (v === 'Active')   return 'success';
  if (v === 'Pending')  return 'warning';
  if (v === 'Inactive') return 'error';
  return 'default';
};

const COLUMNS: DataTableColumn<User>[] = [
  { id: 'id',       header: 'ID',       field: 'id',       width: '60px',  align: 'right' },
  { id: 'name',     header: 'Name',     field: 'name',     sortable: true },
  { id: 'email',    header: 'Email',    field: 'email',    sortable: true },
  { id: 'role',     header: 'Role',     field: 'role',     sortable: true },
  { id: 'status',   header: 'Status',   field: 'status',   sortable: true,
    cellType: 'status', statusStateResolver: STATUS_RESOLVER },
  { id: 'joinDate', header: 'Joined',   field: 'joinDate', sortable: true, cellType: 'date' },
  { id: 'salary',   header: 'Salary',   field: 'salary',   sortable: true,
    cellType: 'currency', align: 'right' },
];

// ─── Row actions ──────────────────────────────────────────────────────────────

const ROW_ACTIONS: RowAction<User>[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'edit',
    onClick: (row) => alert(`Edit: ${row.name}`),
  },
  {
    id: 'view',
    label: 'View',
    icon: 'eye',
    onClick: (row) => alert(`View: ${row.name}`),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'trash',
    danger: true,
    onClick: (row) => alert(`Delete: ${row.name}`),
    onState: (row) => ({ disabled: row.role === 'Admin' }),
  },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof DataTable> = {
  title: 'Data & Typography/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DataTable>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ClientSide: Story = {
  render: () => (
    <DataTable<User>
      columns={COLUMNS}
      data={USERS}
      pageSize={10}
      searchable
      striped
      hoverable
      toolbarActions={[
        { id: 'add', label: 'Add User', icon: 'plus', variant: 'primary', onClick: () => alert('Add user') },
        { id: 'export', label: 'Export', icon: 'download', variant: 'ghost', onClick: () => alert('Export') },
      ]}
      rowActions={ROW_ACTIONS}
      emptyMessage="No users found"
    />
  ),
};

export const WithSelection: Story = {
  render: () => (
    <DataTable<User>
      columns={COLUMNS}
      data={USERS}
      pageSize={8}
      selectable
      searchable
      striped
      onSelectionChange={(rows) => console.log('Selected:', rows.map(r => r.name))}
    />
  ),
};

export const WithApiSupport: Story = {
  render: () => (
    <DataTable<User>
      columns={COLUMNS}
      apiConfig={{
        url: '/api/demo-users',
        method: 'POST',
        mapResponse: (res) => res as { data: User[]; total: number },
      }}
      pageSize={10}
      pageSizeOptions={[5, 10, 25, 50]}
      searchable
      striped
      hoverable
      rowActions={ROW_ACTIONS}
      toolbarActions={[
        { id: 'refresh', label: 'Refresh', icon: 'refresh', variant: 'ghost', onClick: () => {} },
      ]}
    />
  ),
};

export const LoadingState: Story = {
  render: () => (
    <DataTable<User>
      columns={COLUMNS}
      data={[]}
      pageSize={8}
      loading
    />
  ),
};

export const EmptyState: Story = {
  render: () => (
    <DataTable<User>
      columns={COLUMNS}
      data={[]}
      pageSize={10}
      searchable
      emptyMessage="No users match your search. Try a different query."
    />
  ),
};

export const SmallDataset: Story = {
  render: () => (
    <DataTable<User>
      columns={COLUMNS.slice(0, 5)}
      data={USERS.slice(0, 6)}
      pageSize={10}
      hoverable
      rowActions={[
        { id: 'edit', label: 'Edit', icon: 'edit', onClick: (r) => alert(`Edit: ${r.name}`) },
        { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onClick: (r) => alert(`Delete: ${r.name}`) },
      ]}
    />
  ),
};

export const ManyActions: Story = {
  name: 'Many Row Actions (overflow to menu)',
  render: () => (
    <DataTable<User>
      columns={COLUMNS.slice(0, 4)}
      data={USERS.slice(0, 10)}
      pageSize={10}
      rowActions={[
        { id: 'view',     label: 'View',     icon: 'eye',      onClick: (r) => alert(`View: ${r.name}`) },
        { id: 'edit',     label: 'Edit',     icon: 'edit',     onClick: (r) => alert(`Edit: ${r.name}`) },
        { id: 'copy',     label: 'Copy',     icon: 'copy',     onClick: (r) => alert(`Copy: ${r.name}`) },
        { id: 'download', label: 'Export',   icon: 'download', onClick: (r) => alert(`Export: ${r.name}`) },
        { id: 'delete',   label: 'Delete',   icon: 'trash',    danger: true, onClick: (r) => alert(`Delete: ${r.name}`) },
      ]}
    />
  ),
};
