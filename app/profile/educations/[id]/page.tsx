"use client";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import { GrEdit } from "react-icons/gr";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { EducationType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import EducationItem from "@/app/components/ally/returnResumeComponents/EducationItem";
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
      const educationData = await fetchModelRecord("Education", id);
      setEducation(educationData);
      setLoading(false);
    }
    fetchData();
  }, []);
  if (loading) {
    return <TextBlinkLoader text="loading education data" />;
  }
  if (!loading && education) {
    return (
      <div>
        <EducationItem education={education} />
        <Link href={`/profile/educations/${id}/edit`}>
          <button>Edit Item</button>
        </Link>
      </div>
    );
  }
}
