import { AllyContext, useAlly } from "@/app/providers";
import { StepType, UserJobType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useRef, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import EditSingleVolunteer from "./EditSingleVolunteer";
import { topicUserJobMatcher } from "../../aiProcessing/topicUserJobMatcher";
import { TextBlinkLoader } from "../../loader/Loader";
// tk at some point generalize this to be not duplicative of UserJobs components - it's essentially the same
export default function Editing({
  localVolunteers,
  nextStep,
  setLocalVolunteers,
}: {
  localVolunteers: UserJobType[];
  nextStep: StepType;
  setLocalVolunteers: Function;
}) {
  let itemsList: JSX.Element[] = [];

  const {
    job,
    loading,
    loadingText,
    topics,
    volunteers,
    setLoading,
    setLoadingText,
  } = useAlly();
  const [currentVolunteerIndex, setCurrentVolunteerIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<UserJobType>(
    volunteers[currentVolunteerIndex]
  );

  function saveVolunteer(item: UserJobType) {
    let updatedItems = localVolunteers.map((i) =>
      i.id !== item.id ? i : item
    );
    console.log({ updatedItems });
    setLocalVolunteers(updatedItems);
  }
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    async function connectJobsToTopics() {
      if (topics && localVolunteers) {
        console.log(88);
        const result = await topicUserJobMatcher({
          userJobs: localVolunteers,
          topics,
          setLoading,
          setLoadingText,
        });
        console.log(101, result);
        // Mark the matching as complete
        setLocalVolunteers(result as UserJobType[]);
      }
    }
    connectJobsToTopics();
    hasFetched.current = true;
  }, []);

  useEffect(() => {
    setCurrentItem(localVolunteers[currentVolunteerIndex]);
  }, [localVolunteers, currentVolunteerIndex]);

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }

  if (localVolunteers && localVolunteers.length > 0) {
    itemsList = localVolunteers.map((item: UserJobType, index) => {
      return (
        <SidebarItem
          currentIndex={currentVolunteerIndex}
          index={index}
          key={item.id}
          setCurrentIndex={setCurrentVolunteerIndex}
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
          currentIndex={currentVolunteerIndex}
          setCurrentIndex={setCurrentVolunteerIndex}
          items={localVolunteers}
          titleText="Volunteer experience"
        />
        {currentItem &&
          currentItem.userJobQualifications &&
          currentItem.userJobQualifications.length > 0 && (
            <EditSingleVolunteer
              currentVolunteerIndex={currentVolunteerIndex}
              localVolunteers={localVolunteers}
              nextStep={nextStep}
              volunteer={localVolunteers[currentVolunteerIndex]}
              volunteersLength={localVolunteers.length}
              setCurrentVolunteerIndex={setCurrentVolunteerIndex}
              saveVolunteer={saveVolunteer}
            />
          )}
      </div>
    </div>
  );
}
