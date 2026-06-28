import React from 'react';
import { ShellLayout } from './ShellLayout';

/**
 * Auth is now enforced server-side by middleware.ts (redirects before render),
 * so the client-side RoleGuard wrapper is no longer needed here. Removing it
 * also lets the page content actually server-render instead of being gated
 * behind a client-only "isAuthorized" check.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShellLayout>{children}</ShellLayout>;
}
