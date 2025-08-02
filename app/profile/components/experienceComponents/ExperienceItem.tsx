"use client";

import {
  AwardType,
  EducationType,
  QualificationType,
  PastJobType,
} from "@/lib/utils/responseSchemas";
import { GrEdit, GrTrash } from "react-icons/gr";
import {
  generateHeadingText,
  pascalToDashed,
} from "@/lib/utils/stringBuilders";
import { deleteModelRecord } from "@/lib/crud/genericDelete";
import { useRouter } from "next/navigation";
import NavigationLink from "@/app/components/loader/NavigationLink";
import { useLoading } from "@/app/providers/loadingContext";

export default function ResumeItem({
  item,
  itemType,
  setItems,
}: {
  item: AwardType | EducationType | PastJobType | QualificationType;

  itemType: "Award" | "Education" | "PastJob" | "Volunteer";
  setItems: React.Dispatch<
    React.SetStateAction<
      Array<AwardType | EducationType | PastJobType | QualificationType>
    >
  >;
}) {
  const router = useRouter();
  const { setIsLoading } = useLoading();
  async function deleteItem() {
    setItems((prevItems) =>
      prevItems.filter((prevItem) => prevItem.id !== item.id)
    );
    try {
      await deleteModelRecord(itemType, item.id!);
    } catch (error) {
      setItems((prevItems) => [...prevItems, item]);
      console.error(`Error deleting ${itemType} with ID ${item.id}:`, error);
    }
  }

  function editItem() {
    setIsLoading(true);
    router.push(`/profile/${pascalToDashed(itemType)}s/${item.id}/edit`);
  }

  return (
    <tr>
      <td className="tableData" role="cell">
        <NavigationLink
          href={`/profile/${pascalToDashed(itemType)}s/${item.id}`}
        >
          {generateHeadingText(item)}
        </NavigationLink>
      </td>
      <td className="tableData" role="cell">
        <span onClick={editItem}>
          <GrEdit />
        </span>
      </td>
      <td className="tableData" role="cell">
        <span onClick={deleteItem}>
          <GrTrash />
        </span>
      </td>
    </tr>
  );
}
