"use client";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import AdminNavigation from "./components/AdminNavigation";
import { PermissionGuard } from "@/lib/hooks/usePermissions";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const pathname = usePathname();
  const router = useRouter();

  if (authStatus === "configuring") return <div>Loading...</div>;
  if (authStatus !== "authenticated") router.push("/?login=true");

  return (
    <div className="content-container">
      <PermissionGuard role="admin" fallback={<div>Access denied</div>}>
        <AdminNavigation currentPath={pathname} />
        <div className="tab-content">{children}</div>
      </PermissionGuard>
    </div>
  );
}
