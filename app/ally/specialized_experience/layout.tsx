import { ReactNode } from "react";
import { SpecializedExperienceProvider } from "@/app/providers/providers";
export default function SpecializedExperienceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SpecializedExperienceProvider>{children}</SpecializedExperienceProvider>
  );
}
