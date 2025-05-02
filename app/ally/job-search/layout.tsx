import { ReactNode } from "react";
import { JobSearchProvider } from "@/app/providers/jobSearchContext";
export default function JobSearchLayout({ children }: { children: ReactNode }) {
  return <JobSearchProvider>{children}</JobSearchProvider>;
}
