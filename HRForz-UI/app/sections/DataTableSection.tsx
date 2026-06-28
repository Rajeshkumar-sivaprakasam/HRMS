'use client';
import React from 'react';
import { DataTable } from '@/components';
import type { RowAction, StatusState } from '@/components';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  salary: number;
};

export default function DataTableSection() {
  return (
    <div style={{ padding: '1rem 0' }}>
      <DataTable<User>
        columns={[
          { id: 'id',       header: 'ID',     field: 'id',       width: '60px', align: 'right' },
          { id: 'name',     header: 'Name',   field: 'name',     sortable: true },
          { id: 'email',    header: 'Email',  field: 'email',    sortable: true },
          { id: 'role',     header: 'Role',   field: 'role',     sortable: true },
          { id: 'status',   header: 'Status', field: 'status',   sortable: true,
            cellType: 'status',
            statusStateResolver: (v): StatusState =>
              v === 'Active' ? 'success' : v === 'Pending' ? 'warning' : 'error' },
          { id: 'joinDate', header: 'Joined', field: 'joinDate', sortable: true, cellType: 'date' },
          { id: 'salary',   header: 'Salary', field: 'salary',   sortable: true, cellType: 'currency', align: 'right' },
        ]}
        apiConfig={{
          url: '/api/demo-users',
          method: 'POST',

        }}
        pageSize={10}
        pageSizeOptions={[5, 10, 15, 25]}
        searchable
        striped
        hoverable
        toolbarActions={[
          { id: 'add', label: 'Add User', icon: 'plus', variant: 'primary', onClick: () => alert('Add user') },
          { id: 'export', label: 'Export', icon: 'download', variant: 'ghost', onClick: () => alert('Export CSV') },
        ]}
        rowActions={([
          { id: 'edit',   label: 'Edit',   icon: 'edit',  onClick: (r) => alert(`Edit: ${r.name}`) },
          { id: 'view',   label: 'View',   icon: 'eye',   onClick: (r) => alert(`View: ${r.name}`) },
          { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onClick: (r) => alert(`Delete: ${r.name}`),
            onState: (r) => ({ disabled: r.role === 'Admin' }) },
        ] as RowAction<User>[])}
      />
    </div>
  );
}
