import { AwardType } from "@/app/utils/responseSchemas";
import styles from "../ally.module.css";
import { useEffect, useState } from "react";
import AwardForm from "./AwardForm";
export default function AwardsEdit({
  currentIndex,
  award,
  awardsLength,
  saveAward,
  setCurrentIndex,
  setNext,
}: {
  currentIndex: number;
  award: AwardType;
  awardsLength: number;
  saveAward: (award: AwardType) => void;
  setCurrentIndex: (index: number) => void;
  setNext: Function;
}) {
  const [localAward, setLocalAward] = useState<AwardType>(award);
  const onChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLocalAward({ ...localAward, [name]: value });
  };
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveAward(localAward);
    window.scroll(0, 0);
    if (currentIndex !== awardsLength - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      setNext("additional");
    }
  };

  const removeAward = () => {
    const updatedAwards = localAward;
    updatedAwards.title = "";
    updatedAwards.date = "";
    updatedAwards.id = "";
    saveAward(updatedAwards);
    window.scroll(0, 0);
    if (currentIndex !== awardsLength - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      setNext("additional");
    }
  };

  useEffect(() => {
    setLocalAward(award);
  }, [award]);
  return (
    <div>
      <h2>Editing {award.title}</h2>
      <div className={styles.allyChatContainer}>
        Here are the award we extracted from your resume. Please make any
        necessary corrections and fill in missing information.
      </div>
      <div className={`${styles.userChatContainer} ${styles.fade}`}>
        <AwardForm award={localAward} onSubmit={onSubmit} onChange={onChange} />
      </div>
      <button onClick={removeAward}>
        This award is not real or not relevant
      </button>
    </div>
  );
}
