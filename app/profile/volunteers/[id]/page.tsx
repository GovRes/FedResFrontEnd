"use client";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import { GrEdit } from "react-icons/gr";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PastJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import PastJobItem from "@/app/components/ally/returnResumeComponents/PastJobItem";
export default function AwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [volunteer, setVolunteer] = useState<PastJobType>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const volunteerData = await fetchModelRecord("Volunteer", id);
      setVolunteer(volunteerData);
      setLoading(false);
    }
    fetchData();
  }, []);
  if (loading) {
    return <TextBlinkLoader text="loading past job data" />;
  }
  if (!loading && volunteer) {
    return (
      <div>
        <PastJobItem pastJob={volunteer} />
        <Link href={`/profile/volunteers/${id}/edit`}>
          <button>Edit Item</button>
        </Link>
      </div>
    );
  }
}
