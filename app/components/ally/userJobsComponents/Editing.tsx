import { AllyContext } from "@/app/providers";
import { UserJobType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useRef, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import UserJobsForm from "./UserJobsForm";
import { jobDescriptionKeywordFinder } from "../../aiProcessing/jobDescriptionKeywordFinder";
import EditSingleJob from "./EditSingleJob";
import { qualificationsReviewer } from "../../aiProcessing/qualificationsReviewer";
import { topicsCategorizer } from "../../aiProcessing/topicCategorizer";
import { topicUserJobMatcher } from "../../aiProcessing/topicUserJobMatcher";
import { TextBlinkLoader } from "../../loader/Loader";

export default function Details({
  localUserJobs,
  setLocalUserJobs,
  setUserJobsStep,
}: {
  localUserJobs: UserJobType[];
  setLocalUserJobs: Function;
  setUserJobsStep: Function;
}) {
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
    setUserJobs,
  } = context;
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<UserJobType>(
    userJobs[currentJobIndex]
  );
  const [processingError, setProcessingError] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    setCurrentItem(localUserJobs[currentJobIndex]);
  }, [localUserJobs, currentJobIndex]);

  useEffect(() => {
    if (hasFetched.current) return;

    async function fetchJobTopics() {
      try {
        // Set loading state
        // setLoading(true);

        if (job) {
          console.log("Starting jobDescriptionKeywordFinder...");
          setLoadingText("Analyzing job description...");
          const keywordFinderRes = await jobDescriptionKeywordFinder({
            job,
            setLoading,
            setLoadingText,
          });
          console.log("jobDescriptionKeywordFinder completed");

          console.log("Starting topicsCategorizer...");
          //   setLoadingText("Categorizing topics...");
          const topicRes = await topicsCategorizer({
            job,
            keywords: keywordFinderRes,
            setLoading,
            setLoadingText,
          });
          console.log("topicsCategorizer completed");
          setTopics(topicRes);
        }

        if (userJobs.length > 0 && topics && topics?.length > 0) {
          console.log("Starting topicUserJobMatcher...");
          //   setLoadingText("Matching your experience to job requirements...");

          try {
            // Create a promise that will resolve with the result or reject after timeout
            const result = await new Promise((resolve, reject) => {
              // Call the actual function
              topicUserJobMatcher({
                userJobs: localUserJobs,
                topics,
                setLoading,
                setLoadingText,
              })
                .then(resolve)
                .catch(reject);
            });

            console.log("topicUserJobMatcher completed successfully");
            setLocalUserJobs(result as UserJobType[]);
          } catch (error) {
            console.error("Error or timeout in topicUserJobMatcher:", error);
            setProcessingError(
              "The matching process took too long or failed. Using existing data instead."
            );
          }
        }
      } catch (error: unknown) {
        console.error("Error in fetchJobTopics:", error);
        setProcessingError(
          `An error occurred: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        // Always clear loading state, regardless of success or failure
        console.log("Clearing loading state");
        console.log(loading);
        // setLoadingText("");
        // setLoading(false);
      }
    }

    fetchJobTopics();
    hasFetched.current = true;
  }, [job, setLoading, setLoadingText]);

  function saveUserJob(item: UserJobType) {
    let updatedItems = localUserJobs.map((i) => (i.id !== item.id ? i : item));
    setLocalUserJobs(updatedItems);
  }

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  // Make sure we have a valid userJob to display
  if (
    !localUserJobs ||
    localUserJobs.length === 0 ||
    !localUserJobs[currentJobIndex]
  ) {
    return (
      <div className={styles.detailedListEditorContainer}>
        <h3>No Jobs Found</h3>
        <p>We couldn't find any jobs to analyze.</p>
        <button
          className={styles.button}
          onClick={() => setUserJobsStep("initial")}
        >
          Go Back
        </button>
      </div>
    );
  }

  let itemsList: JSX.Element[] = [];

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
        <EditSingleJob
          currentJobIndex={currentJobIndex}
          localUserJobs={localUserJobs}
          userJob={localUserJobs[currentJobIndex]}
          userJobsLength={localUserJobs.length}
          setCurrentJobIndex={setCurrentJobIndex}
          saveUserJob={saveUserJob}
        />
      </div>
    </div>
  );
}
