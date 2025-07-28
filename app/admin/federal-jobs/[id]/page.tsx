"use client";
import { use, useEffect, useState } from "react";
import { Loader } from "@/app/components/loader/Loader";
import { fetchModelRecord } from "@/app/crud/genericFetch";
import { JobType } from "@/app/utils/responseSchemas";
import TopicAccordionItem from "./components/TopicAccordionItem";

export default function EditableFederalJobRecord({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobType>();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const jobData = await fetchModelRecord("Job", id);
        const topics = jobData.topics.items;
        setJob({ ...jobData, topics });
      } catch (err) {
        console.error("Error loading federal job", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !job) {
    return <Loader text="Loading Federal Job" />;
  }
  return (
    <div>
      <h2>
        {job.title} at {job.department}
      </h2>
      <div>
        View on{" "}
        <a
          href={`https://www.usajobs.gov/job/${job.usaJobsId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          USAJobs.gov
        </a>
      </div>
      <div>
        <h3>Topics:</h3>
        <div className="accordion">
          {job.topics &&
            job.topics.map((topic) => (
              <TopicAccordionItem topic={topic} key={topic.id} />
            ))}
        </div>
      </div>
      <div>
        <h3>Questionnaire:</h3>
        <p>{job.questionnaire}</p>
      </div>
      <div>
        <h3>Duties:</h3>
        <p>{job.duties}</p>
      </div>
      <div>
        <h3>Evaluation Criteria:</h3>
        <p>{job.evaluationCriteria}</p>
      </div>
      <div>
        <h3>Qualifications Summary:</h3>
        <p>{job.qualificationsSummary}</p>
      </div>
      <div>
        <h3>Required Documents:</h3>
        <p>{job.requiredDocuments}</p>
      </div>
    </div>
  );
}
