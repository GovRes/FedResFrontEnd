import { AllyContext } from "@/app/providers";
import { AwardType } from "@/app/utils/responseSchemas";
import { JSX, useContext, useEffect, useState } from "react";

import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import styles from "../ally.module.css";
import AwardsEdit from "./AwardsEdit";
import { TextBlinkLoader } from "../../loader/Loader";

export default function Details({
  localAwards,
  setLocalAwards,
  setAwardsStep,
}: {
  localAwards: AwardType[];
  setLocalAwards: Function;
  setAwardsStep: Function;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { loading, loadingText } = context;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<AwardType>(
    localAwards[currentIndex]
  );

  console.log("localAwards", localAwards);

  useEffect(() => {
    setCurrentItem(localAwards[currentIndex]);
  });

  let itemsList: JSX.Element[] = [];

  function saveAward(item: AwardType) {
    let updatedItems = localAwards.map((i) => (i.id !== item.id ? i : item));
    setLocalAwards(updatedItems);
  }

  if (localAwards && localAwards.length > 0) {
    itemsList = localAwards.map((item: AwardType, index) => {
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
      <h3>Awards</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        <Sidebar
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          items={localAwards}
          titleText="Past Jobs"
        />
        <AwardsEdit
          currentIndex={currentIndex}
          award={currentItem}
          awardsLength={localAwards.length}
          setNext={setAwardsStep}
          setCurrentIndex={setCurrentIndex}
          saveAward={saveAward}
        />
      </div>
    </div>
  );
}
