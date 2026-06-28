'use client';
import React from 'react';
import { useRBAC } from './RBACContext';
import type { AccessType } from './types';

export interface CanProps {
  /** pageId that maps to the Angular *hasAccess="pageId" concept */
  pageId: string;
  /** 'r' (default) = view access, 'w' = edit/write access */
  access?: AccessType;
  /** Rendered when the user does NOT have access. Defaults to null (renders nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * React equivalent of Angular's *hasAccess structural directive.
 *
 * Usage:
 *   <Can pageId="users">          — visible to anyone with read on "users"
 *   <Can pageId="users" access="w"> — visible only to writers
 *   <Can pageId="users" fallback={<p>No access</p>}>
 */
export function Can({ pageId, access = 'r', fallback = null, children }: CanProps) {
  const { hasAccess } = useRBAC();
  return <>{hasAccess(pageId, access) ? children : fallback}</>;
}
