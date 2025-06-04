"use client";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import styles from "./profileStyles.module.css";
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
    <div className={styles.profileContainer}>
      <ProfileNavigation currentPath={pathname} />
      <div className={styles.tabContent}>{children}</div>
    </div>
  );
}
