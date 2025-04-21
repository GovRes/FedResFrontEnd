import { AllyContext } from "@/app/providers";
import { StepType, UserJobType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useRef, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import EditSingleJob from "./EditSingleJob";
import { topicUserJobMatcher } from "../../aiProcessing/topicUserJobMatcher";
import { TextBlinkLoader } from "../../loader/Loader";

export default function Editing({
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
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    async function connectJobsToTopics() {
      if (topics && localUserJobs) {
        console.log(88);
        const result = await topicUserJobMatcher({
          userJobs: localUserJobs,
          topics,
          setLoading,
          setLoadingText,
        });
        console.log(101, result);
        // Mark the matching as complete
        setLocalUserJobs(result as UserJobType[]);
      }
    }
    connectJobsToTopics();
    hasFetched.current = true;
  }, []);

  useEffect(() => {
    setCurrentItem(localUserJobs[currentJobIndex]);
  }, [localUserJobs, currentJobIndex]);

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
