import { UserJobType } from "@/app/utils/responseSchemas";
import styles from "../ally.module.css";
import BaseForm from "../../forms/BaseForm";
import {
  SubmitButton,
  TextAreaWithLabel,
  TextWithLabel,
} from "../../forms/Inputs";
import { useEffect, useState } from "react";
export default function UserJobsForm({
  currentIndex,
  userJob,
  userJobsLength,
  saveUserJob,
  setCurrentIndex,
  setNext,
}: {
  currentIndex: number;
  userJob: UserJobType;
  userJobsLength: number;
  saveUserJob: (userJob: UserJobType) => void;
  setCurrentIndex: (index: number) => void;
  setNext: Function;
}) {
  const [localUserJob, setLocalUserJob] = useState<UserJobType>(userJob);
  const onChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLocalUserJob({ ...localUserJob, [name]: value });
  };
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveUserJob(localUserJob);
    window.scroll(0, 0);
    if (currentIndex !== userJobsLength - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      setNext();
    }
  };

  useEffect(() => {
    setLocalUserJob(userJob);
  }, [userJob]);
  return (
    <div>
      <h2>
        Editing {userJob.title} at {userJob.organization}
      </h2>
      <div className={styles.allyChatContainer}>
        Here are the job details we extracted from your resume. Please make any
        necessary corrections and fill in missing information.
      </div>
      <div className={`${styles.userChatContainer} ${styles.fade}`}>
        <BaseForm onSubmit={onSubmit}>
          <TextWithLabel
            label="Title"
            name="title"
            value={localUserJob.title}
            onChange={onChange}
          />
          <TextWithLabel
            label="Organization"
            name="organization"
            value={localUserJob.organization}
            onChange={onChange}
          />
          <TextWithLabel
            label="Start Date"
            name="startDate"
            value={localUserJob.startDate}
            onChange={onChange}
          />
          <TextWithLabel
            label="End Date"
            name="endDate"
            value={localUserJob.endDate}
            onChange={onChange}
          />
          <TextWithLabel
            label="Hours worked per week"
            name="hours"
            value={localUserJob.hours}
            onChange={onChange}
          />
          <TextWithLabel
            label="GS Level (federal jobs only)"
            name="gsLevel"
            value={localUserJob.gsLevel}
            onChange={onChange}
          />
          <TextAreaWithLabel
            label="Responsibilities"
            name="responsibilities"
            value={localUserJob.responsibilities}
            onChange={onChange}
          />
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </div>
  );
}
