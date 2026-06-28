export type AccessType = 'r' | 'w';

// Raw privilege string format: "pageId:accessType"  e.g. "2:r", "51:w"
export type RawPrivilege = string;

// Parsed map: { [pageId]: ['r', 'w'] }
export type PrivilegeMap = Record<string, AccessType[]>;

export interface MenuItemDef {
  id?: string;              // pageId for RBAC; omit to always show
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: MenuItemDef[];
  onClick?: () => void;
}
