'use client';

import React from 'react';
import { DynamicPage, Icon, NameInitials } from '@/components';
import { useTranslation } from '@/lib/i18n';
import type { Employee } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import type { DynamicPageField } from '@/components/DynamicPage/types';

export default function EmployeeListSection() {
  const router = useRouter();
  const { t } = useTranslation();

  const columns = [
    {
      id: 'employee',
      header: t('employees.columns.employee'),
      accessor: (row: Employee) => (
        <NameInitials
          firstName={row.first_name}
          lastName={row.last_name}
          subLabel={row.designation_name || row.designation}
        />
      ),
      sortable: true,
      width: '250px',
    },
    {
      id: 'employee_id',
      header: t('employees.columns.id'),
      accessor: (row: Employee) => row.employee_code || row.employee_id,
      sortable: true,
    },
    {
      id: 'department',
      header: t('employees.columns.department'),
      field: 'department_name',
      sortable: true,
    },
    {
      id: 'location',
      header: t('employees.columns.location'),
      accessor: (row: Employee) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
          <Icon name="map-pin" size={14} />
          <span style={{ fontSize: 13 }}>{row.work_location_city || row.work_location_name || row.location}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: t('employees.columns.status'),
      field: 'status',
      cellType: 'status' as const,
      statusStateResolver: (val: string) => {
        const s = String(val).toLowerCase();
        if (s === 'active') return 'success';
        if (s === 'probation') return 'warning';
        if (s === 'onboarding') return 'info';
        return 'default';
      },
    },
  ];

  const filterFields: DynamicPageField[] = [
    {
      fieldType: 'autocomplete',
      name: 'department',
      label: 'Department',
      placeholder: 'Filter by department',
      fetchUrl: API_ENDPOINTS.DEPARTMENTS_LIST,
      fieldLabel: 'name',
      fieldValue: 'code',
      clearable: true,
    },
    {
      fieldType: 'autocomplete',
      name: 'location',
      label: 'Location',
      placeholder: 'Filter by location',
      fetchUrl: API_ENDPOINTS.LOCATIONS_LIST,
      fieldLabel: 'name',
      fieldValue: 'code',
      clearable: true,
    },
    {
      fieldType: 'autocomplete',
      name: 'status',
      label: 'Status',
      placeholder: 'Filter by status',
      fetchUrl: API_ENDPOINTS.DROPDOWNS.EMPLOYEE_STATUSES,
      fieldLabel: 'label',
      fieldValue: 'code',
      clearable: true,
    },
  ];

  const rowActions = [
    {
      id: 'edit',
      name: 'edit',
      label: 'Edit',
      icon: 'edit',
      isNavigate: true,
    },
    {
      id: 'delete',
      name: 'delete',
      label: 'Delete',
      icon: 'trash',
      danger: true,
      isNavigate: false,
    },
  ];

  const toolbarActions = [
    {
      id: 'filter',
      name: 'filter',
      label: 'Filter',
      icon: 'filter',
      variant: 'secondary' as const,
    },
    {
      id: 'add',
      name: 'addnew',
      label: 'Add employee',
      icon: 'plus',
      variant: 'primary' as const,
      isNavigate: true,
    },
  ];

  const handleAction = async (row: Record<string, unknown>, actionName: string) => {
    const emp = row as unknown as Employee;
    if (actionName === 'addnew') {
      router.push('/employees/add-new');
    } else if (actionName === 'edit') {
      if (emp?.id) router.push(`/employees/edit/${emp.id}`);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>{t('employees.title')}</h1>
        <p style={{ color: '#64748b' }}>{t('employees.subtitle')}</p>
      </div>

      <DynamicPage
        config={{
          pageHeader: '',
          table: {
            pageTitle: t('employees.page_header'),
            columns: columns as any,
            apiConfig: {
              url: API_ENDPOINTS.EMPLOYEES_LIST,
              method: 'POST',
              params: {
                filter: {
                  department: '',
                  location: '',
                  status: '',
                },
              },
            },
            rowActions,
            toolbarActions,
            searchable: true,
            pageSize: 10,
            isServerSidePagination: true,
            deleteUrl: (id) => API_ENDPOINTS.EMPLOYEES_DELETE(id),
            deleteMessage: t('employees.delete_confirm'),
            exportable: true,
            exportOptions: [
              { id: 'csv', label: t('common.export_csv'), icon: 'file-text' },
              { id: 'excel', label: t('common.export_excel'), icon: 'file' },
            ],
          },
          form: {
            crud: [],
            filter: filterFields,
          },
          sideBarOptions: {
            header: {
              filter: t('employees.filter_employees'),
            },
          },
          canEdit: true,
        }}
        onAction={handleAction}
        onExport={(format) => alert(`${t('common.export')} ${format}...`)}
      />
    </div>
  );
}
