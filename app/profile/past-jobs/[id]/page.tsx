"use client";
import { GrEdit } from "react-icons/gr";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PastJobType } from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import PastJobItem from "./components/PastJobItem";
import { fetchPastJobWithQualificationsAndApplications } from "@/lib/crud/pastJob";
export default function PastJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [pastJob, setPastJob] = useState<PastJobType>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await fetchPastJobWithQualificationsAndApplications(id);
      setPastJob(data);
      setLoading(false);
    }
    fetchData();
  }, []);
  if (loading) {
    return <Loader text="loading past job data" />;
  }
  if (!loading && pastJob) {
    return (
      <div>
        <PastJobItem pastJob={pastJob} />
        <Link href={`/profile/past-jobs/${id}/edit`}>
          <button>
            <GrEdit />
          </button>
        </Link>
      </div>
    );
  }
}
