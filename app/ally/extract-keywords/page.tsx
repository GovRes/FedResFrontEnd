"use client";
import { useEffect, useState } from "react";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useAlly } from "@/app/providers";
import { jobDescriptionKeywordFinder } from "@/app/components/aiProcessing/jobDescriptionKeywordFinder";
import { useRouter } from "next/navigation";
import { topicsCategorizer } from "@/app/components/aiProcessing/topicCategorizer";
import { JobType, TopicType } from "@/app/utils/responseSchemas";
import { createOrFindSimilarTopics } from "@/app/crud/topic";
import { completeSteps } from "@/app/utils/stepUpdater";
import { useUserResume } from "@/app/providers/userResumeContext";
import { SageMakerCreateTrainingJob } from "aws-cdk-lib/aws-stepfunctions-tasks";

export default function ExtractKeywords() {
  const { job, setJob } = useAlly();
  const { steps, userResumeId, setSteps } = useUserResume();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (job && job.topics && job.topics.length > 0) {
      return;
    } else {
      async function extractKeywords() {
        if (job) {
          const keywordsRes = await jobDescriptionKeywordFinder({
            job,
          });
          setKeywords(keywordsRes);
        }
      }
      extractKeywords();
    }
  }, [job]);

  function sortTopics() {
    if (job && job.topics && job.topics.length > 0) {
      console.log(job.topics);
      setTopics(job.topics);
    } else {
      async function categorizeTopics() {
        if (job && job.id) {
          setLoading(true);
          const topicRes = await topicsCategorizer({
            job,
            keywords,
          });
          console.log(topicRes);
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

  function buildTopicLI(topic: TopicType) {
    return (
      <li key={topic.id}>
        <h4>{topic.title}</h4>
        <ul>
          {topic.keywords.map((keyword, index) => (
            <li key={index}>{keyword}</li>
          ))}
        </ul>
      </li>
    );
  }

  async function setNext() {
    const updatedSteps = await completeSteps({
      steps,
      stepId: "extract-keywords",
      userResumeId,
    });
    setSteps(updatedSteps);
    router.push("/ally/past-experience");
  }
  if (loading) {
    return <TextBlinkLoader text="finding and sorting keywords from resume" />;
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
      <ul>{topics.map((topic) => buildTopicLI(topic))}</ul>
      <button onClick={setNext}>
        Help me build a federal resume that focuses on these topics.
      </button>
    </div>
  );
}
