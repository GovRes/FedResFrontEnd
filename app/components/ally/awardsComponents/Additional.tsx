import { AwardType } from "@/app/utils/responseSchemas";
import AwardForm from "./AwardForm";
import { JSX, useContext, useState } from "react";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import styles from "../ally.module.css";
import { AllyContext } from "@/app/providers";
import { v4 as uuidv4 } from "uuid";
export default function Additional({
  localAwards,
  setLocalAwards,
}: {
  localAwards: AwardType[];
  setLocalAwards: React.Dispatch<React.SetStateAction<AwardType[]>>;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { setAwards, setStep } = context;
  const [award, setAward] = useState<AwardType>({
    id: uuidv4(),
    title: "",
    date: "",
  });

  let itemsList: JSX.Element[] = [];
  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setAward({ ...award, [name]: value });
  }
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalAwards((prev) => [...prev, award]);
    setAward({ id: uuidv4(), title: "", date: "" });
  }

  function completeAndMoveOn() {
    setAwards(localAwards);
    setStep("return_resume");
  }
  if (localAwards && localAwards.length > 0) {
    itemsList = localAwards.map((item: AwardType, index) => {
      return (
        <SidebarItem
          currentIndex={0}
          index={index}
          key={item.id}
          setCurrentIndex={() => {}}
          item={item}
        />
      );
    });
  }
  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Awards</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        <Sidebar
          currentIndex={0}
          setCurrentIndex={() => {}}
          items={localAwards}
          titleText="Awards"
        />
        <div>
          <h3>Additional Awards</h3>
          <p>If you have any other awards to add, you can include them here.</p>
          <AwardForm award={award} onChange={onChange} onSubmit={onSubmit} />
          <button onClick={completeAndMoveOn}>Done adding awards</button>
        </div>
      </div>
    </div>
  );
}
