'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Role Guard Component
 * Protects routes based on user role and authentication status
 */
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('hrforz_token');
    // In a real app, you would decode the JWT to check the role
    // For now, we just check if token exists
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Role check logic would go here
    // Example: const userRole = decodeToken(token).role;
    // if (allowedRoles && !allowedRoles.includes(userRole)) router.push('/unauthorized');

    setIsAuthorized(true);
  }, [router, allowedRoles]);

  if (!isAuthorized) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
