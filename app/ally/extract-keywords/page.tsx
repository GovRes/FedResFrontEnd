"use client";
import { useEffect, useState } from "react";
import { Loader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { jobDescriptionKeywordFinder } from "@/app/components/aiProcessing/jobDescriptionKeywordFinder";
import { topicsCategorizer } from "@/app/components/aiProcessing/topicCategorizer";
import { TopicType } from "@/app/utils/responseSchemas";
import { createOrFindSimilarTopics } from "@/app/crud/topic";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import TopicLI from "./components/TopicLI";

export default function ExtractKeywords() {
  const { job, setJob } = useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  const { completeStep } = useApplication();
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
    await completeStep("extract-keywords");
    navigateToNextIncompleteStep("extract-keywords");
  }
  if (loading) {
    return <Loader text="finding and sorting keywords from job description" />;
  }
  //tk make a cool animation where the words are everywhere and then they get sorted.
  if (!topics) {
    return (
      <div>
        <h3>Job description keywords extracted!</h3>
        <div className="info-box">
          <div>
            <strong>What This List Shows</strong>
          </div>
          <div>
            We pulled the most important skills and duties from the job posting.
            These are the things the hiring team will expect you to show in your
            resume.
          </div>
          <div>
            Soon, you'll work with the AI to describe your experience with these
            topics. For now, just take a look—this gives you a preview of what
            you'll be asked about.
          </div>
        </div>
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
      <div className="info-box">
        <div>
          <strong>How Your Resume Will Be Structured</strong>
        </div>
        <div>
          We grouped the keywords into topics. Each group will become a
          paragraph in your federal resume.
        </div>
        <div>
          In the next steps, you’ll work with the AI to describe your experience
          for each keyword—so your resume matches what this job is looking for.
          Once you’ve provided that experience, the AI will draft your resume
          for your review
        </div>
      </div>
      <ul>{topics.map((topic) => TopicLI(topic))}</ul>
      <button onClick={setNext}>
        Help me build a federal resume that focuses on these topics.
      </button>
    </div>
  );
}
