import { useEffect, useState } from "react";
import Link from "next/link";
import ExperiencesTable from "./experienceComponents/ExperiencesTable";
import {
  AwardType,
  EducationType,
  // ResumeType,
  SpecializedExperienceType,
  PastJobQualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import {
  fetchUserAssociations,
  AssociationType,
} from "@/app/crud/userAssociations";
import { TextBlinkLoader } from "../../components/loader/Loader";
import { pascalToDashed } from "@/app/utils/stringBuilders";

// Define a type that represents all possible item types
type ExperienceItemType =
  | AwardType
  | EducationType
  | SpecializedExperienceType
  | PastJobType
  | PastJobQualificationType;

export default function ExperienceDashboard({
  experienceType,
}: {
  experienceType: "PastJob" | "Award" | "Volunteer" | "Education";
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
      <Link href={`/profile/${pascalToDashed(experienceType)}s/new`}>
        <button>Add New {experienceType}</button>
      </Link>
    </div>
  );
}
