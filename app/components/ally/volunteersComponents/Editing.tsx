import { AllyContext, useAlly } from "@/app/providers";
import { StepType, PastJobType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useRef, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import EditSingleVolunteer from "./EditSingleVolunteer";
import { topicPastJobMatcher } from "../../aiProcessing/topicPastJobMatcher";
import { TextBlinkLoader } from "../../loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
// tk at some point generalize this to be not duplicative of PastJobs components - it's essentially the same
export default function Editing({
  localVolunteers,
  nextStep,
  setLocalVolunteers,
}: {
  localVolunteers: PastJobType[];
  nextStep: StepType;
  setLocalVolunteers: Function;
}) {
  let itemsList: JSX.Element[] = [];

  const { loading, loadingText, topics, volunteers } = useAlly();
  const { job } = useApplication();
  const [currentVolunteerIndex, setCurrentVolunteerIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<PastJobType>(
    volunteers[currentVolunteerIndex]
  );

  function saveVolunteer(item: PastJobType) {
    let updatedItems = localVolunteers.map((i) =>
      i.id !== item.id ? i : item
    );
    setLocalVolunteers(updatedItems);
  }
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    async function connectJobsToTopics() {
      if (topics && localVolunteers) {
        const result = await topicPastJobMatcher({
          pastJobs: localVolunteers,
          topics,
        });
        // Mark the matching as complete
        setLocalVolunteers(result as PastJobType[]);
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
    itemsList = localVolunteers.map((item: PastJobType, index) => {
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
          currentItem.pastJobQualifications &&
          currentItem.pastJobQualifications.length > 0 && (
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
