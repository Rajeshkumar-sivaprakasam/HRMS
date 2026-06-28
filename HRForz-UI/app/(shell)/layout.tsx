import React from 'react';
import { ShellLayout } from './ShellLayout';

import { RoleGuard } from '@/app/shared/auth/role.guard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard>
      <ShellLayout>{children}</ShellLayout>
    </RoleGuard>
  );
}
