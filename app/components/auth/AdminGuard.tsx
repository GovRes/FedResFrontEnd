// src/components/auth/AdminGuard.tsx

"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();

        // Check if user has admin group
        // This could be stored in a custom attribute or you might need to check your database
        const groups = attributes["custom:groups"] || "";
        const isUserAdmin = groups.includes("admins");

        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          // Redirect to unauthorized page instead of login
          router.push("/unauthorized");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        // If not authenticated, redirect to login
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking permissions...</div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Unauthorized
            </h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  if (isAdmin === true) {
    return <>{children}</>;
  }

  return null;
}

// Alternative version that checks the database instead of Cognito attributes
export function AdminGuardWithDatabase({
  children,
  fallback,
}: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // You would import and use your user service here
        // const { userManagementService } = await import('@/lib/services/UserManagementService');
        // const profile = await userManagementService.getCurrentUserProfile();
        // const isUserAdmin = profile?.groups?.includes('admins') || false;

        // For now, placeholder logic:
        const isUserAdmin = false; // Replace with actual logic

        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          router.push("/unauthorized");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checking permissions...</div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Unauthorized
            </h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  if (isAdmin === true) {
    return <>{children}</>;
  }

  return null;
}
