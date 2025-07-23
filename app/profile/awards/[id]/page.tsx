"use client";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import { GrEdit } from "react-icons/gr";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AwardType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import NavigationLink from "@/app/components/loader/NavigationLink";
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
        <NavigationLink href={`/profile/awards/${id}/edit`}>
          <GrEdit />
        </NavigationLink>
      </div>
    );
  }
}
