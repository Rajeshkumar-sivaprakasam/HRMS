'use client';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, Navbar, Heading, Icon, Button, ToastProvider } from '@/components';
import { apiService } from '@/app/core/services/api-service';
import { API_ENDPOINTS } from '@/app/shared/constants/api-endpoints';
import { notificationsApi } from '@/lib/api';

const NAV_SECTIONS = [
  {
    label: 'WORKSPACE',
    items: [
      { id: 'overview',  label: 'Overview',  icon: <Icon name="home"     size={16} />, href: '/dashboard' },
      { id: 'employees', label: 'Employees', icon: <Icon name="users"    size={16} />, href: '/employees' },
      { id: 'attendance', label: 'Attendance', icon: <Icon name="clock"    size={16} />, href: '/attendance' },
      { id: 'leave',     label: 'Leave',     icon: <Icon name="calendar" size={16} />, href: '/leave' },
      { id: 'my-finance', label: 'My finance', icon: <Icon name="wallet"   size={16} />, href: '/my-finance' },
      { id: 'helpdesk',      label: 'Helpdesk',     icon: <Icon name="ticket"   size={16} />, href: '/helpdesk'      },
      { id: 'organisation',  label: 'Organisation', icon: <Icon name="layers"   size={16} />, href: '/organisation'  },
    ],
  },
];

const BRAND = { letter: 'H', name: 'HRForz', subtitle: 'Finforz · IN' };

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({ name: 'Arjun Mehta', role: 'Employee' });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsApi.list(true).then((res: any) => {
      const items = res?.response ?? res?.data ?? [];
      setUnreadCount(Array.isArray(items) ? items.length : (res?.response?.total ?? 0));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const employeeId = localStorage.getItem('hrforz_employee_id');
      const savedName = localStorage.getItem('hrforz_user_name');
      const savedRole = localStorage.getItem('hrforz_role');

      // Capitalize first letter of role
      const formatRole = (role: string) => {
        if (!role) return 'Employee';
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
      };

      if (savedName && savedRole) {
        setUser({ name: savedName, role: formatRole(savedRole) });
        return;
      }

      if (employeeId) {
        try {
          const res = await apiService.get<any>(API_ENDPOINTS.EMPLOYEES_GET(employeeId));
          const data = res.response?.data || res.data || res.response;
          if (data) {
            const fullName = `${data.first_name} ${data.last_name}`;
            const role = data.designation_name || data.role || savedRole || 'Employee';
            const formattedRole = formatRole(role);
            setUser({ name: fullName, role: formattedRole });
            localStorage.setItem('hrforz_user_name', fullName);
            localStorage.setItem('hrforz_role_formatted', formattedRole);
          }
        } catch (err) {
          console.error('Failed to fetch user profile', err);
          setUser({ name: 'Arjun Mehta', role: formatRole(savedRole || 'Employee') });
        }
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('hrforz_')) {
        localStorage.removeItem(key);
      }
    });
    router.replace('/login');
  };

  const allItems = NAV_SECTIONS.flatMap(s => s.items);
  const activeItem = allItems.find(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  const pageTitle = activeItem?.label ?? (pathname === '/notifications' ? 'Notifications' : 'HRForz');

  const sections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      active: item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false,
    })),
  }));

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: <Icon name="settings" size={16} />, href: '/settings', active: pathname === '/settings' },
    { id: 'signout', label: 'Sign out', icon: <Icon name="logout" size={16} />, onClick: handleLogout },
  ];

  return (
    <ToastProvider position="topRight">
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6fa' }}>
        <Sidebar
          brand={BRAND}
          sections={sections}
          bottomItems={bottomItems}
          user={user}
          collapsible
        />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Navbar
            logo={<Heading level="h4">{pageTitle}</Heading>}
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Mail inbox */}
                <div style={{ position: 'relative' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/inbox')}
                    style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="mail" size={20} color="#64748b" />
                  </Button>
                </div>

                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/notifications')}
                    style={{ borderRadius: '50%', width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="bell" size={20} color="#64748b" />
                  </Button>
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid #fff', lineHeight: 1 }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            }
          />
          <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
