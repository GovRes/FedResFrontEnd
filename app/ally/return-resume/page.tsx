"use client";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { useContext, useEffect, useState } from "react";
import PastJobItem from "./components/PastJobItem";
import EducationExperienceItem from "./components/EducationItem";
import { fetchUserAttributes } from "aws-amplify/auth";
import styles from "./resume.module.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Loader } from "@/app/components/loader/Loader";
import AwardItem from "./components/AwardItem";
import { getApplicationAssociations } from "@/app/crud/application";
import { useApplication } from "@/app/providers/applicationContext";
import { set } from "zod";

export default function ReturnResume() {
  interface UserAttributes {
    "custom:citizen"?: string;
    "custom:disabled"?: string;
    "custom:veteran"?: string;
    "custom:militarySpouse"?: string;
    [key: string]: string | undefined;
  }

  const [attr, setAttr] = useState<UserAttributes>({});
  const [loading, setLoading] = useState(false);
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [educations, setEducations] = useState<EducationType[]>([]);

  const [pastJobs, setPastJobs] = useState<PastJobType[]>([]);
  const [volunteers, setVolunteers] = useState<PastJobType[]>([]);
  const { applicationId } = useApplication();
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);
  useEffect(() => {
    async function getUserAttributes() {
      setLoading(true);
      if (authStatus === "authenticated") {
        const attrRes = await fetchUserAttributes();
        setAttr(attrRes);
      }
      setLoading(false);
    }
    getUserAttributes();
  }, [user, authStatus]);

  useEffect(() => {
    async function loadApplicationAssociations() {
      setLoading(true);
      try {
        const [awardRes, educationRes, pastJobRes] = await Promise.all([
          getApplicationAssociations({
            applicationId,
            associationType: "Award",
          }),
          getApplicationAssociations({
            applicationId,
            associationType: "Education",
          }),
          getApplicationAssociations({
            applicationId,
            associationType: "PastJob",
          }),
        ]);
        setAwards(awardRes as AwardType[]);
        setEducations(educationRes as EducationType[]);

        let pastJobs = pastJobRes?.filter((job) => job.type !== "volunteer");
        setPastJobs(pastJobs as PastJobType[]);
        let volunteers = pastJobRes?.filter((job) => job.type === "volunteer");
        setVolunteers(volunteers as PastJobType[]);
      } catch (error) {
        console.error("Error fetching user attributes:", error);
      } finally {
        setLoading(false);
      }
    }
    if (applicationId) {
      loadApplicationAssociations();
    }
  }, [applicationId]);

  if (loading || !attr) {
    return <Loader text="pulling user profile info" />;
  }
  return (
    <div>
      <h2>Here is your Resume</h2>
      <div>
        <div className={styles.userInfo}>
          <div>Your Name Here</div>
          <div>Your Address</div>
          <div>Your Phone Number</div>
          <div>Your email</div>
        </div>

        <div className={styles.userDemos}>
          {attr["custom:citizen"] && <div>US Citizen</div>}
          {attr["custom:disabled"] && <div>Disabled</div>}
          {attr["custom:veteran"] && <div>Veteran</div>}
          {attr["custom:militarySpouse"] && <div>Military Spouse</div>}
        </div>

        <div className={styles.resumeSection}>
          <h3 className={styles.workExperience}>Work Experience</h3>
          {pastJobs.map((pastJob: PastJobType) => (
            <PastJobItem key={pastJob.id} pastJob={pastJob} />
          ))}
        </div>
        <div className={styles.resumeSection}>
          <h3 className={styles.education}>Education and Certifications</h3>
          {educations.map((ed: EducationType) => (
            <EducationExperienceItem key={ed.id} education={ed} />
          ))}
        </div>
        <div className={styles.resumeSection}>
          <h3 className={styles.additionalInfo}>
            Volunteer/Community Service Experiences
          </h3>
          {volunteers.map((volunteer: PastJobType) => (
            <PastJobItem key={volunteer.id} pastJob={volunteer} />
          ))}
        </div>
        <div className={styles.resumeSection}>
          <h3 className={styles.additionalInfo}>Awards and Achievements</h3>

          {awards.map((award: AwardType) => (
            <AwardItem key={award.id} award={award} />
          ))}
        </div>
      </div>
    </div>
  );
}
