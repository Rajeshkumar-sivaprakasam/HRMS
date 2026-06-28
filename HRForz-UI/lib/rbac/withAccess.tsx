'use client';
import React from 'react';
import { AccessGuard } from './AccessGuard';
import type { AccessType } from './types';

/**
 * HOC equivalent of Angular's RoleGuard applied to a component.
 * Wraps a page/component with an AccessGuard so the component itself
 * stays clean of any auth logic.
 *
 * Usage:
 *   const ProtectedSettings = withAccess(SettingsPage, 'settings', 'w');
 *   // Then use <ProtectedSettings /> anywhere — renders 403 if no write access
 */
export function withAccess<P extends object>(
  Component: React.ComponentType<P>,
  pageId: string,
  access: AccessType = 'r',
  fallback?: React.ReactNode
) {
  const displayName = Component.displayName ?? Component.name ?? 'Component';

  function WithAccessWrapper(props: P) {
    return (
      <AccessGuard pageId={pageId} access={access} fallback={fallback}>
        <Component {...props} />
      </AccessGuard>
    );
  }

  WithAccessWrapper.displayName = `withAccess(${displayName})`;
  return WithAccessWrapper;
}
