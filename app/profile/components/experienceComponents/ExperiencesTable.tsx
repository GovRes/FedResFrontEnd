import styles from "../../resumes/resumeComponents/resumeStyles.module.css";
import {
  AwardType,
  EducationType,
  ResumeType,
  SpecializedExperienceType,
  QualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import ExperienceItem from "./ExperienceItem";

export default function ExperiencesTable({
  experienceType,
  items,
  setItems,
}: {
  experienceType: "Award" | "Education" | "PastJob" | "Volunteer";
  items: Array<
    | AwardType
    | EducationType
    | SpecializedExperienceType
    | PastJobType
    | QualificationType
  >;
  setItems: React.Dispatch<
    React.SetStateAction<
      Array<
        | AwardType
        | EducationType
        | SpecializedExperienceType
        | PastJobType
        | QualificationType
      >
    >
  >;
}) {
  return (
    <div>
      <table className={styles.resumesTable} role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead">Name</th>
            <th className="tableHead"></th>
            <th className="tableHead"></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {items &&
            items.map(
              (
                item:
                  | AwardType
                  | EducationType
                  | SpecializedExperienceType
                  | PastJobType
                  | QualificationType
              ) => (
                <ExperienceItem
                  key={item.id}
                  item={item}
                  itemType={experienceType}
                  setItems={setItems}
                />
              )
            )}
        </tbody>
      </table>
    </div>
  );
}
