"use client";
import { fetchModelRecord } from "@/lib/crud/genericFetch";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { EducationType } from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import EducationItem from "@/app/ally/return-resume/components/EducationItem";
import { GrEdit } from "react-icons/gr";
export default function AwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [education, setEducation] = useState<EducationType>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await fetchModelRecord("Education", id);
      setEducation(data);
      setLoading(false);
    }
    fetchData();
  }, []);
  if (loading) {
    return <Loader text="loading education data" />;
  }
  if (!loading && education) {
    return (
      <div>
        <EducationItem education={education} />
        <Link href={`/profile/educations/${id}/edit`}>
          <button>
            <GrEdit />
          </button>
        </Link>
      </div>
    );
  }
}
