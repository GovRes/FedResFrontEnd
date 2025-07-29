"use client";
import { useEffect, useState } from "react";
import { Loader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { jobDescriptionKeywordFinder } from "@/app/components/aiProcessing/jobDescriptionKeywordFinder";
import { topicsCategorizer } from "@/app/components/aiProcessing/topicCategorizer";
import { TopicType } from "@/app/utils/responseSchemas";
import { createOrFindSimilarTopics } from "@/app/crud/topic";
import TopicLI from "./components/TopicLI";
import { navigateToNextIncompleteStep } from "@/app/utils/nextStepNavigation";
import { useRouter } from "next/navigation";
export default function ExtractKeywords() {
  const { job, setJob, steps } = useApplication();
  const { applicationId, completeStep } = useApplication();
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicType[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only proceed if we have no job or job has no topics
    if (job && job.topics && job.topics.length > 0) return;
    // Extract keywords if there's a job
    async function extractKeywords() {
      if (!job) return;

      setLoading(true);
      const keywordsRes = await jobDescriptionKeywordFinder({ job });
      setKeywords(keywordsRes);
      setLoading(false);
    }

    extractKeywords();
  }, [job]);

  function sortTopics() {
    if (job && job.topics && job.topics.length > 0) {
      setTopics(job.topics);
    } else {
      async function categorizeTopics() {
        if (job && job.id) {
          setLoading(true);
          const topicRes = await topicsCategorizer({
            job,
            keywords,
          });
          await createOrFindSimilarTopics({ jobId: job.id, topics: topicRes });
          setJob({
            ...job,
            topics: topicRes,
          });
          setLoading(false);
        }
      }
      categorizeTopics();
    }
  }

  useEffect(() => {
    if (job && job.topics && job.topics.length > 0) {
      setTopics(job.topics);
      setNext();
    }
  }, []);

  async function setNext() {
    await completeStep("extract-keywords", applicationId);
    navigateToNextIncompleteStep({
      steps,
      router,
      currentStepId: "extract-keywords",
      applicationId,
      completeStep,
    });
  }
  if (loading) {
    return <Loader text="finding and sorting keywords from job description" />;
  }
  //tk make a cool animation where the words are everywhere and then they get sorted.
  if (!topics) {
    return (
      <div>
        <h3>Job description keywords extracted!</h3>
        <ul>
          {keywords.map((keyword, index) => (
            <li key={index}>{keyword}</li>
          ))}
        </ul>
        <button onClick={sortTopics}>Sort Keywords into Topics</button>
      </div>
    );
  }
  return (
    <div>
      <h3>Keywords sorted into Topics</h3>
      <ul>{topics.map((topic) => TopicLI(topic))}</ul>
      <button onClick={setNext}>
        Help me build a federal resume that focuses on these topics.
      </button>
    </div>
  );
}
