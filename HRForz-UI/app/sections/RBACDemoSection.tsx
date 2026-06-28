'use client';
import React, { useState, useMemo } from 'react';
import { Button, Badge, Alert, Divider, Heading, Text } from '@/components';
import { RBACProvider, Can, AccessGuard, useAccess, filterMenuItems } from '@/lib/rbac';
import type { MenuItemDef, RawPrivilege } from '@/lib/rbac';

// ─── Mock role definitions (mirrors Angular privilege string format) ──────────

const ROLES: Record<string, { label: string; color: 'primary' | 'success' | 'warning'; privileges: RawPrivilege[] }> = {
  admin: {
    label: 'Admin',
    color: 'primary',
    privileges: [
      'dashboard:r',
      'users:w',
      'reports:w',
      'settings:w',
      'billing:w',
    ],
  },
  editor: {
    label: 'Editor',
    color: 'success',
    privileges: [
      'dashboard:r',
      'users:r',
      'reports:w',
    ],
  },
  viewer: {
    label: 'Viewer',
    color: 'warning',
    privileges: [
      'dashboard:r',
      'reports:r',
    ],
  },
};

// ─── Demo menu tree (matches Angular IMenuItem structure) ─────────────────────

const MENU_ITEMS: MenuItemDef[] = [
  { label: 'Dashboard', href: '#', id: 'dashboard' },
  {
    label: 'User Management',
    children: [
      { label: 'All Users', href: '#', id: 'users' },
      { label: 'Roles & Permissions', href: '#', id: 'settings' },
    ],
  },
  { label: 'Reports', href: '#', id: 'reports' },
  { label: 'Billing', href: '#', id: 'billing' },
  { label: 'Help', href: '#' }, // no id → always visible
];

// ─── Sub-demos that consume RBAC hooks ───────────────────────────────────────

function ButtonLevelDemo() {
  const users = useAccess('users');
  const settings = useAccess('settings');
  const billing = useAccess('billing');

  return (
    <div>
      <Heading level="h4" style={{ marginBottom: '0.75rem' }}>Button / Component level</Heading>
      <Text variant="body2" style={{ marginBottom: '1rem', color: '#6b7280' }}>
        Uses <code>useAccess(pageId)</code> hook — same logic as Angular&apos;s HasAccessDirective.
      </Text>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Always visible — no access guard */}
        <Button variant="ghost" size="sm">View Dashboard</Button>

        {/* Visible to anyone with read on users */}
        {users.canView && (
          <Button variant="secondary" size="sm">View Users</Button>
        )}

        {/* Visible only to writers */}
        {users.canEdit && (
          <Button variant="primary" size="sm">Edit User</Button>
        )}

        {settings.canEdit && (
          <Button variant="primary" size="sm">Manage Roles</Button>
        )}

        {billing.canEdit && (
          <Button variant="danger" size="sm">Billing Settings</Button>
        )}
      </div>
    </div>
  );
}

function CanComponentDemo() {
  return (
    <div>
      <Heading level="h4" style={{ marginBottom: '0.75rem' }}>
        &lt;Can&gt; component — declarative conditional rendering
      </Heading>
      <Text variant="body2" style={{ marginBottom: '1rem', color: '#6b7280' }}>
        React equivalent of Angular&apos;s <code>*hasAccess=&quot;pageId&quot;</code> structural directive.
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Can pageId="dashboard">
          <Alert variant="info">Dashboard — visible to all authenticated users (read access).</Alert>
        </Can>
        <Can pageId="reports" access="w">
          <Alert variant="success">Reports panel — visible only to users who can write reports.</Alert>
        </Can>
        <Can
          pageId="billing"
          access="w"
          fallback={
            <Alert variant="warning">Billing — you need Admin access to view this section.</Alert>
          }
        >
          <Alert variant="success">Billing details — visible to Admins only.</Alert>
        </Can>
      </div>
    </div>
  );
}

function PageLevelDemo() {
  const [showProtected, setShowProtected] = useState(false);

  return (
    <div>
      <Heading level="h4" style={{ marginBottom: '0.75rem' }}>
        &lt;AccessGuard&gt; — page-level protection
      </Heading>
      <Text variant="body2" style={{ marginBottom: '1rem', color: '#6b7280' }}>
        Mirrors Angular&apos;s <code>RoleGuard canActivate</code>. Renders a 403 view when access is denied.
      </Text>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowProtected(p => !p)}
        style={{ marginBottom: '1rem' }}
      >
        {showProtected ? 'Hide' : 'Show'} Protected Page
      </Button>
      {showProtected && (
        <AccessGuard pageId="settings" access="w">
          <div style={{
            padding: '1.5rem', border: '1px solid #d1fae5',
            borderRadius: '8px', background: '#f0fdf4',
          }}>
            <Heading level="h5" style={{ color: '#15803d' }}>Settings Page</Heading>
            <Text>This content is protected by AccessGuard (requires write access to &quot;settings&quot;).</Text>
          </div>
        </AccessGuard>
      )}
    </div>
  );
}

function MenuFilterDemo({ privileges }: { privileges: RawPrivilege[] }) {
  // Re-build hasAccess locally so menuFilter works without a second context
  const privilegeMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const entry of privileges) {
      const colonIdx = entry.lastIndexOf(':');
      if (colonIdx === -1) continue;
      const id = entry.slice(0, colonIdx);
      const access = entry.slice(colonIdx + 1).toLowerCase();
      if (!map[id]) map[id] = [];
      map[id].push(access);
    }
    return map;
  }, [privileges]);

  const hasAccess = (pageId: string, access: 'r' | 'w' = 'r') => {
    const acc = privilegeMap[pageId];
    if (!acc) return false;
    if (access === 'r') return acc.includes('r') || acc.includes('w');
    return acc.includes('w');
  };

  const visibleMenu = filterMenuItems(MENU_ITEMS, hasAccess);

  return (
    <div>
      <Heading level="h4" style={{ marginBottom: '0.75rem' }}>
        Menu-level filtering
      </Heading>
      <Text variant="body2" style={{ marginBottom: '1rem', color: '#6b7280' }}>
        <code>filterMenuItems()</code> recursively removes inaccessible items — same as Angular&apos;s
        <code> shouldShowItem()</code> sidebar logic. Parent items hidden when all children are hidden.
      </Text>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <Text variant="body2" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Full menu</Text>
          <MenuList items={MENU_ITEMS} dim />
        </div>
        <div style={{ flex: 1 }}>
          <Text variant="body2" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>After filtering</Text>
          <MenuList items={visibleMenu} />
        </div>
      </div>
    </div>
  );
}

function MenuList({ items, dim, depth = 0 }: { items: MenuItemDef[]; dim?: boolean; depth?: number }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i}>
          <div style={{
            padding: `0.25rem ${0.75 + depth * 1}rem`,
            fontSize: '0.875rem',
            color: dim ? '#9ca3af' : '#111827',
            borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none',
            marginLeft: depth > 0 ? '0.75rem' : 0,
          }}>
            {item.label}
            {item.id && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                [{item.id}]
              </span>
            )}
          </div>
          {item.children && (
            <MenuList items={item.children} dim={dim} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Root section — owns the role switcher and RBACProvider ──────────────────

export default function RBACDemoSection() {
  const [activeRole, setActiveRole] = useState<keyof typeof ROLES>('viewer');
  const role = ROLES[activeRole];

  return (
    <RBACProvider privileges={role.privileges}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>

        {/* Role switcher */}
        <div style={{
          padding: '1.25rem 1.5rem', background: '#f9fafb',
          border: '1px solid #e5e7eb', borderRadius: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Text style={{ fontWeight: 600, margin: 0 }}>Active role:</Text>
            <Badge color={role.color}>{role.label}</Badge>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
              {Object.entries(ROLES).map(([key, r]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={activeRole === key ? 'primary' : 'ghost'}
                  onClick={() => setActiveRole(key as keyof typeof ROLES)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {role.privileges.map(p => (
              <Badge key={p} color="primary">{p}</Badge>
            ))}
          </div>
        </div>

        <Divider />

        {/* 1. Button / component level */}
        <ButtonLevelDemo />

        <Divider />

        {/* 2. <Can> declarative rendering */}
        <CanComponentDemo />

        <Divider />

        {/* 3. Page-level AccessGuard */}
        <PageLevelDemo />

        <Divider />

        {/* 4. Menu filtering */}
        <MenuFilterDemo privileges={role.privileges} />

      </div>
    </RBACProvider>
  );
}
