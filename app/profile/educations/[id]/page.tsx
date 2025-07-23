"use client";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import NavigationLink from "@/app/components/loader/NavigationLink";
import { use, useEffect, useState } from "react";
import { EducationType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import EducationItem from "@/app/ally/return-resume/components/EducationItem";
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
    return <Loader text="loading education data" />;
  }
  if (!loading && education) {
    return (
      <div>
        <EducationItem education={education} />
        <NavigationLink href={`/profile/educations/${id}/edit`}>
          <button>Edit Item</button>
        </NavigationLink>
      </div>
    );
  }
}
