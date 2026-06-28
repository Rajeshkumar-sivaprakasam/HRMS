'use client';
import React from 'react';
import { useRBAC } from './RBACContext';
import type { AccessType } from './types';

function DefaultForbidden() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
      border: '1px dashed #e5e7eb', borderRadius: '8px', color: '#6b7280',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
      <h2 style={{ margin: '0 0 0.5rem', color: '#111827', fontSize: '1.25rem' }}>
        403 — Access Denied
      </h2>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>
        You don&apos;t have permission to view this page.
      </p>
    </div>
  );
}

export interface AccessGuardProps {
  /** pageId to check, matching Angular route.data['pageId'] */
  pageId: string;
  /** Required access level. Defaults to 'r'. */
  access?: AccessType;
  /** Custom content to show instead of the default 403 view */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Page-level guard — mirrors Angular's RoleGuard canActivate logic.
 * Wrap an entire page (or section) to enforce access at the top level.
 *
 * Usage:
 *   <AccessGuard pageId="settings">
 *     <SettingsPage />
 *   </AccessGuard>
 */
export function AccessGuard({
  pageId,
  access = 'r',
  fallback,
  children,
}: AccessGuardProps) {
  const { hasAccess } = useRBAC();
  if (!hasAccess(pageId, access)) {
    return <>{fallback ?? <DefaultForbidden />}</>;
  }
  return <>{children}</>;
}
