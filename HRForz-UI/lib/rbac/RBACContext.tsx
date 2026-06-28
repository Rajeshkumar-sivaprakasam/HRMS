'use client';
import React, { createContext, useContext, useMemo } from 'react';
import type { AccessType, PrivilegeMap, RawPrivilege } from './types';

interface RBACContextValue {
  privilegeMap: PrivilegeMap;
  hasAccess: (pageId: string, access?: AccessType) => boolean;
}

const RBACContext = createContext<RBACContextValue>({
  privilegeMap: {},
  hasAccess: () => false,
});

function parsePrivileges(raw: RawPrivilege[]): PrivilegeMap {
  const map: PrivilegeMap = {};
  for (const entry of raw) {
    const colonIdx = entry.lastIndexOf(':');
    if (colonIdx === -1) continue;
    const pageId = entry.slice(0, colonIdx);
    const access = entry.slice(colonIdx + 1).toLowerCase() as AccessType;
    if (!map[pageId]) map[pageId] = [];
    map[pageId].push(access);
  }
  return map;
}

export interface RBACProviderProps {
  privileges: RawPrivilege[];
  children: React.ReactNode;
}

export function RBACProvider({ privileges, children }: RBACProviderProps) {
  const privilegeMap = useMemo(() => parsePrivileges(privileges), [privileges]);

  const hasAccess = useMemo(
    () =>
      (pageId: string, access: AccessType = 'r'): boolean => {
        const accesses = privilegeMap[pageId];
        if (!accesses) return false;
        // write implies read
        if (access === 'r') return accesses.includes('r') || accesses.includes('w');
        return accesses.includes('w');
      },
    [privilegeMap]
  );

  return (
    <RBACContext.Provider value={{ privilegeMap, hasAccess }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC(): RBACContextValue {
  return useContext(RBACContext);
}
