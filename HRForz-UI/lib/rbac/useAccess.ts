import { useRBAC } from './RBACContext';

export interface AccessResult {
  canView: boolean;
  canEdit: boolean;
}

/**
 * Returns canView / canEdit for a single pageId.
 * canEdit implies canView (write > read), matching Angular hasAccess directive behaviour.
 */
export function useAccess(pageId: string): AccessResult {
  const { hasAccess } = useRBAC();
  return {
    canView: hasAccess(pageId, 'r'),
    canEdit: hasAccess(pageId, 'w'),
  };
}
