import { ReactNode } from "react";

export default function PastJobDetailsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // This layout component wraps both the main page and the dynamic [id] page
  return <>{children}</>;
}
