// Core
export { RBACProvider, useRBAC } from './RBACContext';
export type { RBACProviderProps } from './RBACContext';

// Hook
export { useAccess } from './useAccess';
export type { AccessResult } from './useAccess';

// Component-level guard (React equiv of Angular *hasAccess directive)
export { Can } from './Can';
export type { CanProps } from './Can';

// Page-level guard (React equiv of Angular RoleGuard canActivate)
export { AccessGuard } from './AccessGuard';
export type { AccessGuardProps } from './AccessGuard';

// HOC wrapper
export { withAccess } from './withAccess';

// Menu filtering utility
export { filterMenuItems } from './menuFilter';

// Types
export type { AccessType, RawPrivilege, PrivilegeMap, MenuItemDef } from './types';
