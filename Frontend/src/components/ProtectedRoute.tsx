import { Navigate } from "react-router-dom";
import { getCurrentUserRole, hasAccess, type UserRole } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

/**
 * ProtectedRoute component that checks if the current user has access to a route
 * based on their role. Redirects to fallback path (default: /auth) if not authorized.
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = "/auth" 
}: ProtectedRouteProps) {
  const userRole = getCurrentUserRole();
  const token = localStorage.getItem("token");

  // If no token, redirect to auth
  if (!token) {
    return <Navigate to={fallbackPath} replace />;
  }

  // If user role is not in allowed roles, redirect to dashboard or fallback
  if (!userRole || !hasAccess(userRole, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

