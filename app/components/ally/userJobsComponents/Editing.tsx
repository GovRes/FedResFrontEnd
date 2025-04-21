import { AllyContext } from "@/app/providers";
import { StepType, UserJobType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import { jobDescriptionKeywordFinder } from "../../aiProcessing/jobDescriptionKeywordFinder";
import EditSingleJob from "./EditSingleJob";
import { topicsCategorizer } from "../../aiProcessing/topicCategorizer";
import { topicUserJobMatcher } from "../../aiProcessing/topicUserJobMatcher";
import { TextBlinkLoader } from "../../loader/Loader";

export default function Details({
  localUserJobs,
  nextStep,
  setLocalUserJobs,
}: {
  localUserJobs: UserJobType[];
  nextStep: StepType;
  setLocalUserJobs: Function;
}) {
  let itemsList: JSX.Element[] = [];
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const {
    job,
    loading,
    loadingText,
    topics,
    userJobs,
    setLoading,
    setLoadingText,
    setTopics,
  } = context;
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<UserJobType>(
    userJobs[currentJobIndex]
  );
  function saveUserJob(item: UserJobType) {
    let updatedItems = localUserJobs.map((i) => (i.id !== item.id ? i : item));
    console.log({ updatedItems });
    setLocalUserJobs(updatedItems);
  }

  async function getKeywordsAndTopics() {
    if (!job) return;
    const keywordFinderRes = await jobDescriptionKeywordFinder({
      job,
      setLoading,
      setLoadingText,
    });
    const topicRes = await topicsCategorizer({
      job,
      keywords: keywordFinderRes,
      setLoading,
      setLoadingText,
    });
    setTopics(topicRes);
  }

  async function connectTopicsToCurrentUserJob() {
    console.log("Connecting topics to current user job");
    console.log(topics, localUserJobs);
    if (!topics || !localUserJobs) return;
    const result = await topicUserJobMatcher({
      userJobs: localUserJobs,
      topics,
      setLoading,
      setLoadingText,
    });
    console.log("topicUserJobMatcher completed successfully");
    console.log({ result });
    setLocalUserJobs(result as UserJobType[]);
  }

  useEffect(() => {
    setCurrentItem(localUserJobs[currentJobIndex]);
  }, [localUserJobs, currentJobIndex]);

  useEffect(() => {
    (async () => {
      await getKeywordsAndTopics();
      await connectTopicsToCurrentUserJob();
    })();
  }, []);
  useEffect(() => {
    (async () => {
      await connectTopicsToCurrentUserJob();
    })();
  }, [topics]);
  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }

  if (localUserJobs && localUserJobs.length > 0) {
    itemsList = localUserJobs.map((item: UserJobType, index) => {
      return (
        <SidebarItem
          currentIndex={currentJobIndex}
          index={index}
          key={item.id}
          setCurrentIndex={setCurrentJobIndex}
          item={item}
        />
      );
    });
  }

  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Connect your past experience to your future role at {job?.title}</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        <Sidebar
          currentIndex={currentJobIndex}
          setCurrentIndex={setCurrentJobIndex}
          items={localUserJobs}
          titleText="Past Jobs"
        />
        {currentItem &&
          currentItem.userJobQualifications &&
          currentItem.userJobQualifications.length > 0 && (
            <EditSingleJob
              currentJobIndex={currentJobIndex}
              localUserJobs={localUserJobs}
              nextStep={nextStep}
              userJob={localUserJobs[currentJobIndex]}
              userJobsLength={localUserJobs.length}
              setCurrentJobIndex={setCurrentJobIndex}
              saveUserJob={saveUserJob}
            />
          )}
      </div>
    </div>
  );
}
