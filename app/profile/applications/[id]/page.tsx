"use client";
import { GrEdit } from "react-icons/gr";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ApplicationType,
  PastJobType,
  QualificationType,
} from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { getApplicationWithJobAndQualifications } from "@/lib/crud/application";

export default function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [application, setApplication] = useState<ApplicationType>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await getApplicationWithJobAndQualifications({ id });
      console.log(data);
      // Transform the data to match ApplicationType
      data.qualifications.items.map((q: any) => {
        console.log(q.qualification);
        q.qualification.pastJobs.items.map((pj: PastJobType) => {
          console.log(pj);
        });
      });
      const transformedApplication: ApplicationType = {
        ...data,
        job: {
          ...data.job,
          topics: data.job.topics?.items || null,
        },
        // Add missing fields with defaults
        awards: null,
        educations: null,
        pastJobs: null,
        volunteers: null,
        // Transform qualifications if they exist
        qualifications:
          data.qualifications?.items
            .map((q: any) => q.qualification)
            .sort((a: QualificationType, b: QualificationType) => {
              if (a.id < b.id) {
                return -1;
              } else return 1;
            }) || null,
      };

      setApplication(transformedApplication);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <Loader text="loading application" />;
  }

  console.log(29, loading, application);

  if (!loading && application) {
    console.log(30);
    console.log(application.qualifications);
    return (
      <div>
        <h1>Application for {application.job.title}</h1>

        {application.qualifications && application.qualifications.length > 0 ? (
          <div>
            <h2>Qualifications</h2>
            <ul>
              {application.qualifications.map(
                (qualification: QualificationType) => (
                  <li key={qualification.id}>
                    {qualification.id} - {qualification.title} (
                    {qualification.pastJobs.items[0].pastJob.title} -{" "}
                    {qualification.pastJobs.items[0].pastJob.organization})
                  </li>
                )
              )}
            </ul>
          </div>
        ) : (
          <div></div>
        )}
        <Link href={`/profile/applications/${id}/edit`}>
          <button>
            <GrEdit />
          </button>
        </Link>
      </div>
    );
  }
}
