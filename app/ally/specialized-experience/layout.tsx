import { ReactNode } from "react";
import { SpecializedExperienceProvider } from "@/app/providers/specializedExperienceContext";
export default function SpecializedExperienceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SpecializedExperienceProvider>{children}</SpecializedExperienceProvider>
  );
}
