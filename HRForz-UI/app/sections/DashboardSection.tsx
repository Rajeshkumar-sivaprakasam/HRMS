'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Card, CardHeader, Badge } from '@/components';
import { EmployeeDashboard } from '../(shell)/dashboard/_components/EmployeeDashboard';
import { HRDashboard } from '../(shell)/dashboard/_components/HRDashboard';

const SECTIONS = [
  { href: '/form-controls',  label: 'Form Controls',      desc: 'Inputs, selects, checkboxes, radio, date pickers and more.' },
  { href: '/display',        label: 'Display & Feedback',  desc: 'Alerts, badges, modals, toasts, tooltips, and progress.' },
  { href: '/layout-overlay', label: 'Layout & Overlay',   desc: 'Cards, dividers, tabs, drawers, and layout primitives.' },
  { href: '/icons-charts',   label: 'Icons & Charts',     desc: 'Icon set and chart components powered by Recharts.' },
  { href: '/json-forms',     label: 'JSON Forms',         desc: 'Schema-driven forms using JSON Form spec.' },
  { href: '/datatable',      label: 'DataTable',          desc: 'Sortable, filterable data table with built-in pagination.', isNew: true },
  { href: '/typography',     label: 'Data & Typography',  desc: 'Headings, body, lead, stat cards, and data display.' },
  { href: '/access-control', label: 'Access Control',     desc: 'Role-based access control (RBAC) demo with permission gates.' },
];

export default function DashboardSection() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('hrforz_role');
    setRole(storedRole);
  }, []);

  if (role === 'employee') {
    return <EmployeeDashboard />;
  }

  if (role === 'hr_admin') {
    return <HRDashboard />;
  }

  return (
    <>
      <Typography variant="lead" style={{ marginBottom: 28 }}>
        A production-ready UI kit built with Next.js, TypeScript, and SCSS Modules — styled to the HRForz design system.
      </Typography>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {SECTIONS.map(s => (
          <a key={s.href} href={s.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card hoverable style={{ height: '100%' }}>
              <CardHeader
                title={s.label}
                actions={s.isNew ? <Badge color="primary" size="sm">New</Badge> : undefined}
              />
              <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.55 }}>{s.desc}</p>
            </Card>
          </a>
        ))}
      </div>
    </>
  );
}
