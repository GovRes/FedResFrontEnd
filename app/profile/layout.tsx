"use client";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import ProfileNavigation from "./components/ProfileNavigation";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const pathname = usePathname();
  const router = useRouter();

  if (authStatus === "configuring")
    return <div className="content">Loading...</div>;
  if (authStatus !== "authenticated") router.push("/?login=true");

  return (
    <div className="content-container">
      <ProfileNavigation currentPath={pathname} />
      <div className="tab-content">{children}</div>
    </div>
  );
}
