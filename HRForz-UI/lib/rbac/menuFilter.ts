import type { MenuItemDef, AccessType } from './types';

type HasAccessFn = (pageId: string, access?: AccessType) => boolean;

/**
 * Recursively filters a menu tree — mirrors Angular's shouldShowItem() + *hasAccess logic.
 *
 * Rules (same as Angular sidebar):
 *  - Items without an id are always shown (public items, section headers, etc.)
 *  - Leaf items with an id are shown only if the user has read access to that id
 *  - Parent items with children are shown only if ≥1 child survives filtering
 */
export function filterMenuItems(
  items: MenuItemDef[],
  hasAccess: HasAccessFn
): MenuItemDef[] {
  const result: MenuItemDef[] = [];

  for (const item of items) {
    if (item.children && item.children.length > 0) {
      const visibleChildren = filterMenuItems(item.children, hasAccess);
      if (visibleChildren.length > 0) {
        result.push({ ...item, children: visibleChildren });
      }
    } else {
      if (!item.id || hasAccess(item.id, 'r')) {
        result.push(item);
      }
    }
  }

  return result;
}
