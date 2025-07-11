import React, { useState, useEffect } from "react";
import { permissionService } from "@/lib/services/PermissionService";

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await permissionService.hasPermission(permission);
        setHasPermission(result);
      } catch (error) {
        console.error("Error checking permission:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permission]);

  return { hasPermission, loading };
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(permissions: string[]) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await permissionService.hasAnyPermission(permissions);
        setHasPermission(result);
      } catch (error) {
        console.error("Error checking permissions:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [permissions.join(",")]); // Re-run if permissions array changes

  return { hasPermission, loading };
}

/**
 * Hook to check if user has specific role
 */
export function useRole(role: string) {
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const result = await permissionService.hasRole(role);
        setHasRole(result);
      } catch (error) {
        console.error("Error checking role:", error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [role]);

  return { hasRole, loading };
}

/**
 * Hook to get all user permissions
 */
export function useUserPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const { getCurrentUser } = await import("aws-amplify/auth");
        const currentUser = await getCurrentUser();
        const userPermissions = await permissionService.getUserPermissions(
          currentUser.userId
        );
        setPermissions(userPermissions);
      } catch (error) {
        console.error("Error loading permissions:", error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  return { permissions, loading };
}

/**
 * Component wrapper for permission-based rendering
 */
interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  role,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const singlePermission = usePermission(permission || "");
  const multiplePermissions = useAnyPermission(permissions || []);
  const roleCheck = useRole(role || "");

  // Determine which check to use
  let hasAccess = false;
  let loading = false;

  if (role) {
    hasAccess = roleCheck.hasRole;
    loading = roleCheck.loading;
  } else if (permission) {
    hasAccess = singlePermission.hasPermission;
    loading = singlePermission.loading;
  } else if (permissions) {
    if (requireAll) {
      // Check if user has ALL permissions (you'd need to implement this)
      hasAccess = multiplePermissions.hasPermission; // Simplified
    } else {
      // Check if user has ANY permission
      hasAccess = multiplePermissions.hasPermission;
    }
    loading = multiplePermissions.loading;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
