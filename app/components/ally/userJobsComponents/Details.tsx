import { AllyContext } from "@/app/providers";
import { UserJobType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import UserJobsForm from "./UserJobsForm";
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
  const { loading, loadingText } = context;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<UserJobType>(
    localUserJobs[currentIndex]
  );

  useEffect(() => {
    setCurrentItem(localUserJobs[currentIndex]);
  });

  let itemsList: JSX.Element[] = [];

  function saveUserJob(item: UserJobType) {
    let updatedItems = localUserJobs.map((i) => (i.id !== item.id ? i : item));
    setLocalUserJobs(updatedItems);
  }

  if (localUserJobs && localUserJobs.length > 0) {
    itemsList = localUserJobs.map((item: UserJobType, index) => {
      return (
        <SidebarItem
          currentIndex={currentIndex}
          index={index}
          key={item.id}
          setCurrentIndex={setCurrentIndex}
          item={item}
        />
      );
    });
  }

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
  }
  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Job Details</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        <Sidebar
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          items={localUserJobs}
          titleText="Past Jobs"
        />
        <UserJobsForm
          currentIndex={currentIndex}
          userJob={currentItem}
          userJobsLength={localUserJobs.length}
          setNext={setUserJobsStep}
          setCurrentIndex={setCurrentIndex}
          saveUserJob={saveUserJob}
        />
      </div>
    </div>
  );
}
