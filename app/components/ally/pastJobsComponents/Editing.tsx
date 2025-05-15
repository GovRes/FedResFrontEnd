import { AllyContext, useAlly } from "@/app/providers";
import { StepType, PastJobType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useRef, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import EditSingleJob from "./EditSingleJob";
import { topicPastJobMatcher } from "../../aiProcessing/topicPastJobMatcher";
import { TextBlinkLoader } from "../../loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";

export default function Editing({
  localPastJobs,
  nextStep,
  setLocalPastJobs,
}: {
  localPastJobs: PastJobType[];
  nextStep: StepType;
  setLocalPastJobs: Function;
}) {
  let itemsList: JSX.Element[] = [];

  const {
    // job,
    loading,
    loadingText,
    topics,
    pastJobs,
    setLoading,
    setLoadingText,
  } = useAlly();
  const { job } = useApplication();
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<PastJobType>(
    pastJobs[currentJobIndex]
  );

  function savePastJob(item: PastJobType) {
    let updatedItems = localPastJobs.map((i) => (i.id !== item.id ? i : item));
    setLocalPastJobs(updatedItems);
  }
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    async function connectJobsToTopics() {
      if (topics && localPastJobs) {
        const result = await topicPastJobMatcher({
          pastJobs: localPastJobs,
          topics,
        });
        // Mark the matching as complete
        setLocalPastJobs(result as PastJobType[]);
      }
    }
    connectJobsToTopics();
    hasFetched.current = true;
  }, []);

  useEffect(() => {
    setCurrentItem(localPastJobs[currentJobIndex]);
  }, [localPastJobs, currentJobIndex]);

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }

  if (localPastJobs && localPastJobs.length > 0) {
    itemsList = localPastJobs.map((item: PastJobType, index) => {
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
          items={localPastJobs}
          titleText="Past Jobs"
        />
        {currentItem &&
          currentItem.pastJobQualifications &&
          currentItem.pastJobQualifications.length > 0 && (
            <EditSingleJob
              currentJobIndex={currentJobIndex}
              localPastJobs={localPastJobs}
              // nextStep={nextStep}
              pastJob={localPastJobs[currentJobIndex]}
              pastJobsLength={localPastJobs.length}
              setCurrentJobIndex={setCurrentJobIndex}
              savePastJob={savePastJob}
            />
          )}
      </div>
    </div>
  );
}
