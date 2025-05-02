import { useEffect, useState } from "react";
import ExperiencesTable from "./experienceComponents/ExperiencesTable";
import {
  AwardType,
  EducationType,
  // ResumeType,
  SpecializedExperienceType,
  UserJobQualificationType,
  UserJobType,
  VolunteerType,
} from "@/app/utils/responseSchemas";
import {
  fetchUserAssociations,
  AssociationType,
} from "@/app/crud/userAssociations";
import { TextBlinkLoader } from "../../components/loader/Loader";

// Define a type that represents all possible item types
type ExperienceItemType =
  | AwardType
  | EducationType
  // | ResumeType
  | SpecializedExperienceType
  | UserJobType
  | UserJobQualificationType
  | VolunteerType;

export default function ResumeDashboard({
  experienceType,
}: {
  experienceType: "UserJob" | "Award" | "Volunteer" | "Education";
}) {
  const [items, setItems] = useState<ExperienceItemType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getUserItems() {
      setLoading(true);
      try {
        // Explicitly cast experienceType to AssociationType for type safety
        const associationType = experienceType as AssociationType;

        // Use the explicit type parameter for fetchUserAssociations
        const itemsRes = await fetchUserAssociations<ExperienceItemType>(
          associationType
        );

        // Now itemsRes should match the expected type for setItems
        setItems(itemsRes);
      } catch (error) {
        console.error("Error fetching user items:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!items.length) {
      getUserItems();
    }
  }, [experienceType, items.length]);

  if (loading) {
    return <TextBlinkLoader text="Loading..." />;
  }

  return (
    <div>
      <ExperiencesTable
        items={items}
        experienceType={experienceType}
        setItems={setItems}
      />
    </div>
  );
}
