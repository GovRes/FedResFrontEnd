"use client";
import { GrEdit } from "react-icons/gr";
import Link from "next/link";
import { use, useEffect, useState, useMemo } from "react";
import {
  ApplicationType,
  AwardType,
  EducationType,
  PastJobType,
  QualificationType,
} from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { getApplicationWithAllAssociations } from "@/lib/crud/application";
import QualificationItem from "./components/QualificationItem";
import AwardItem from "./components/AwardItem";
import EducationItem from "./components/EducationItem";
import PastJobItem from "./components/PastJobItem";
import { useRouter } from "next/navigation";

export default function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationType>();
  const [loading, setLoading] = useState(true);

  const filteredPastJobs = useMemo(
    () =>
      application?.pastJobs?.filter(
        (pj: PastJobType) => pj.type === "PastJob"
      ) || [],
    [application?.pastJobs]
  );

  const filteredVolunteerJobs = useMemo(
    () =>
      application?.pastJobs?.filter(
        (pj: PastJobType) => pj.type === "Volunteer"
      ) || [],
    [application?.pastJobs]
  );

  const setSessionApplication = () => {
    // Set the applicationId in sessionStorage
    sessionStorage.setItem("applicationId", application.id.toString());

    // Trigger the custom event to notify layout that sessionStorage has changed
    const event = new CustomEvent("applicationIdChanged");
    window.dispatchEvent(event);

    // Navigate to the ally page
    router.push("/ally");
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await getApplicationWithAllAssociations({ id });

      if (data) {
        setApplication(data as ApplicationType);
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <Loader text="loading application" />;
  }

  if (!application) {
    return <div>Application not found</div>;
  }

  return (
    <div>
      <h1>Application for {application.job.title}</h1>

      <h2>Associated Awards</h2>
      {application.awards && application.awards.length > 0 ? (
        <ul>
          {application.awards.map((award: AwardType) => (
            <AwardItem award={award} key={award.id} />
          ))}
        </ul>
      ) : (
        <p>No awards associated with this application.</p>
      )}

      <h2>Associated Educations</h2>
      {application.educations && application.educations.length > 0 ? (
        <ul>
          {application.educations.map((education: EducationType) => (
            <EducationItem education={education} key={education.id} />
          ))}
        </ul>
      ) : (
        <p>No educations associated with this application.</p>
      )}

      <h2>Past Jobs</h2>
      {filteredPastJobs.length > 0 ? (
        <ul>
          {filteredPastJobs.map((pastJob: PastJobType) => (
            <PastJobItem
              pastJob={pastJob}
              pastJobType="PastJob"
              key={pastJob.id}
            />
          ))}
        </ul>
      ) : (
        <p>No past jobs associated with this application.</p>
      )}

      <h2>Volunteer Experience</h2>
      {filteredVolunteerJobs.length > 0 ? (
        <ul>
          {filteredVolunteerJobs.map((pastJob: PastJobType) => (
            <PastJobItem
              pastJob={pastJob}
              pastJobType="Volunteer"
              key={pastJob.id}
            />
          ))}
        </ul>
      ) : (
        <p>No volunteer experience associated with this application.</p>
      )}

      {application.qualifications && application.qualifications.length > 0 ? (
        <div>
          <h2>Qualifications</h2>
          <ul>
            {application.qualifications.map(
              (qualification: QualificationType) => (
                <QualificationItem
                  qualification={qualification}
                  key={qualification.id}
                />
              )
            )}
          </ul>
        </div>
      ) : (
        <div></div>
      )}

      <button onClick={setSessionApplication}>Continue Application</button>

      <Link href={`/profile/applications/${id}/edit`}>
        <button>
          <GrEdit />
        </button>
      </Link>
    </div>
  );
}
