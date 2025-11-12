// Role-based access control utilities

export type UserRole = 'Admin' | 'Analyst' | 'Investigator' | 'Viewer';

export interface MenuItem {
  title: string;
  url: string;
  icon: any;
  roles: UserRole[]; // Roles that can access this menu item
}

/**
 * Check if a user role has access to a specific route
 */
export function hasAccess(userRole: UserRole | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Get the current user role from localStorage
 */
export function getCurrentUserRole(): UserRole | null {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr) as { role?: string };
      return (user.role as UserRole) || null;
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }
  return null;
}

/**
 * Filter menu items based on user role
 */
export function filterMenuItemsByRole(menuItems: MenuItem[], userRole: UserRole | null): MenuItem[] {
  if (!userRole) return [];
  return menuItems.filter(item => hasAccess(userRole, item.roles));
}

