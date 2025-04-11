import {
  SpecializedExperienceType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import SpecializedExperienceItem from "./returnResumeComponents/SpecializedExperienceItem";
import { useContext, useEffect, useState } from "react";
import { AllyContext } from "@/app/providers";
import UserJobItem from "./returnResumeComponents/UserJobItem";
import EducationExperienceItem from "./returnResumeComponents/EducationExperienceItem";
import { fetchUserAttributes } from "aws-amplify/auth";
import styles from "./resume.module.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { TextBlinkLoader } from "../loader/Loader";

export default function ReturnResume() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }

  const {
    loading,
    loadingText,
    setLoading,
    setLoadingText,
    specializedExperiences,
    userJobs,
  } = context;
  //   might want to change this store education as a separate thing from specialized experiences
  const special = specializedExperiences.filter(
    (s) => s.typeOfExperience === "other" || s.typeOfExperience === "experience"
  );
  const education = specializedExperiences.filter(
    (s) =>
      s.typeOfExperience === "degree" ||
      s.typeOfExperience === "license" ||
      s.typeOfExperience === "certification"
  );
  interface UserAttributes {
    "custom:citizen"?: string;
    "custom:disabled"?: string;
    "custom:veteran"?: string;
    "custom:militarySpouse"?: string;
    [key: string]: string | undefined;
  }

  const [attr, setAttr] = useState<UserAttributes>({});

  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);
  useEffect(() => {
    async function getUserAttributes() {
      setLoading(true);
      setLoadingText("pulling user profile info");
      if (authStatus === "authenticated") {
        const attrRes = await fetchUserAttributes();
        setAttr(attrRes);
        console.log(attr);
      }
      setLoading(false);
    }
    getUserAttributes();
  }, [user, authStatus]);

  if (loading || !attr) {
    return <TextBlinkLoader text={loadingText} />;
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
          <h3 className={styles.specializedExperience}>
            Specialized Experience
          </h3>
          {special.map((experience: SpecializedExperienceType) => (
            <SpecializedExperienceItem
              key={experience.id}
              specializedExperience={experience}
            />
          ))}
        </div>

        <div className={styles.resumeSection}>
          <h3 className={styles.workExperience}>Work Experience</h3>
          {userJobs.map((userJob: UserJobType) => (
            <UserJobItem key={userJob.id} userJob={userJob} />
          ))}
        </div>
        <div className={styles.resumeSection}>
          <h3 className={styles.education}>Education and Certifications</h3>
          {education.map((experience: SpecializedExperienceType) => (
            <EducationExperienceItem
              key={experience.id}
              experience={experience}
            />
          ))}
        </div>
        <div className={styles.resumeSection}>
          <h3 className={styles.additionalInfo}>
            Volunteer/Community Service Experiences
          </h3>
        </div>
        <div className={styles.resumeSection}>
          <h3 className={styles.additionalInfo}>Awards and Achievements</h3>
        </div>
      </div>
    </div>
  );
}
