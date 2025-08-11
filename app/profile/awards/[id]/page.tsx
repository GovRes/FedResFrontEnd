"use client";
import Link from "next/link";
import { fetchModelRecord } from "@/lib/crud/genericFetch";
import { GrEdit } from "react-icons/gr";
import { use, useEffect, useState } from "react";
import { AwardType } from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
export default function AwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [award, setAward] = useState<AwardType>();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const awardData = await fetchModelRecord("Award", id);
      setAward(awardData);
      setLoading(false);
    }
    fetchData();
  }, []);
  if (loading) {
    return <Loader text="loading award data" />;
  }
  if (!loading && award) {
    return (
      <div>
        <strong>{award.title}</strong> ({award.date})
        <Link href={`/profile/awards/${id}/edit`}>
          <GrEdit />
        </Link>
      </div>
    );
  }
}
