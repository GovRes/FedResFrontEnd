import { useEffect, useState } from "react";
import Link from "next/link";
import ExperiencesTable from "./experienceComponents/ExperiencesTable";
import {
  AwardType,
  EducationType,
  QualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import {
  fetchUserAssociations,
  AssociationType,
} from "@/app/crud/userAssociations";
import { Loader } from "../../components/loader/Loader";
import { pascalToDashed } from "@/app/utils/stringBuilders";

// Define a type that represents all possible item types

type ExperienceItemType =
  | AwardType
  | EducationType
  | PastJobType
  | QualificationType;

const buttonTextMapping = {
  PastJob: "Add a Past Job",
  Award: "Add New Award",
  Volunteer: "Add Volunteer Experience",
  Education: "Add New Education",
};

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
        let associationType = experienceType as AssociationType;
        if (experienceType === "Volunteer") {
          associationType = "PastJob";
        }
        // Use the explicit type parameter for fetchUserAssociations
        const itemsRes =
          await fetchUserAssociations<ExperienceItemType>(associationType);
        if (experienceType === "Volunteer") {
          // If the experienceType is "Volunteer", we need to filter the items
          // to only include those that are of type "Volunteer"
          const filteredItems = itemsRes.filter(
            (item): item is PastJobType =>
              "type" in item && item.type === "Volunteer"
          );
          setItems(filteredItems);
          return;
        } else if (experienceType === "PastJob") {
          const filteredItems = itemsRes.filter(
            (item): item is PastJobType =>
              "type" in item && item.type === "PastJob"
          );
          const sortedItems = filteredItems.sort((a, b) =>
            a.organization > b.organization ? 1 : -1
          );
          setItems(sortedItems);
          return;
        }
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
    return <Loader text="Loading..." />;
  }

  return (
    <div>
      <ExperiencesTable
        items={items}
        experienceType={experienceType}
        setItems={setItems}
      />
      <Link href={`/profile/${pascalToDashed(experienceType)}s/new`}>
        <button>{buttonTextMapping[experienceType]}</button>
      </Link>
    </div>
  );
}
