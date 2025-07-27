"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JobSearchContext } from "@/app/providers/jobSearchContext";
import UsaJobsSearch from "@/app/ally/job-search/components/UsaJobsSearch";
import { Loader } from "@/app/components/loader/Loader";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { JobSearchObject } from "@/app/utils/responseSchemas";
import { useLoading } from "@/app/providers/loadingContext";
import PastJobUrl from "./components/PasteJobUrl";

export default function JobSearchPage() {
  const router = useRouter();

  return <PastJobUrl />;
}
