"use client";
import { useContext, useEffect } from "react";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { AllyContext } from "@/app/providers";
import { jobDescriptionKeywordFinder } from "@/app/components/aiProcessing/jobDescriptionKeywordFinder";
import { useRouter } from "next/navigation";
import { topicsCategorizer } from "@/app/components/aiProcessing/topicCategorizer";
import { TopicType } from "@/app/utils/responseSchemas";

export default function ExtractKeywords() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    job,
    keywords,
    loading,
    loadingText,
    topics,
    setKeywords,
    setLoading,
    setLoadingText,
    setTopics,
  } = context;
  const router = useRouter();
  useEffect(() => {
    async function extractKeywords() {
      if (job) {
        const keywordsRes = await jobDescriptionKeywordFinder({
          job,
          setLoading,
          setLoadingText,
        });
        console.log(keywordsRes);
        setKeywords(keywordsRes);
        // router.push("/ally/sort_topics");
      }
    }
    extractKeywords();
  }, [job, setLoading, setLoadingText]);
  function sortTopics() {
    async function categorizeTopics() {
      if (job) {
        const topicRes = await topicsCategorizer({
          job,
          keywords,
          setLoading,
          setLoadingText,
        });
        setTopics(topicRes);
      }
    }
    categorizeTopics();
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
  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  //tk make a cool animation where the words are everywhere and then they get sorted.
  if (!topics) {
    return (
      <div>
        <h3>Keywords extracted!</h3>
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
      <button onClick={() => router.push("/ally/resume")}>
        Help me build a federal resume that focuses on these topics.
      </button>
    </div>
  );
}
