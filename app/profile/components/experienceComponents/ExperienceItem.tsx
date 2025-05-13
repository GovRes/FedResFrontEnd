"use client";

import {
  AwardType,
  EducationType,
  SpecializedExperienceType,
  PastJobQualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import styles from "./resumeStyles.module.css";
import { GrEdit, GrTrash } from "react-icons/gr";
import { useEffect, useState } from "react";
import {
  generateHeadingText,
  pascalToDashed,
} from "@/app/utils/stringBuilders";
import { deleteModelRecord } from "@/app/crud/genericDelete";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResumeItem({
  item,
  itemType,
  setItems,
}: {
  item:
    | AwardType
    | EducationType
    | SpecializedExperienceType
    | PastJobType
    | PastJobQualificationType;

  itemType: "Award" | "Education" | "PastJob" | "Volunteer";
  setItems: React.Dispatch<
    React.SetStateAction<
      Array<
        | AwardType
        | EducationType
        | SpecializedExperienceType
        | PastJobType
        | PastJobQualificationType
      >
    >
  >;
}) {
  const router = useRouter();
  async function deleteItem() {
    setItems((prevItems) =>
      prevItems.filter((prevItem) => prevItem.id !== item.id)
    );
    try {
      await deleteModelRecord(itemType, item.id);
    } catch (error) {
      setItems((prevItems) => [...prevItems, item]);
      console.error(`Error deleting ${itemType} with ID ${item.id}:`, error);
    }
  }

  function editItem() {
    router.push(`/profile/${pascalToDashed(itemType)}s/${item.id}/edit`);
  }

  return (
    <tr>
      <td className="tableData" role="cell">
        <Link href={`/profile/${pascalToDashed(itemType)}s/${item.id}`}>
          {generateHeadingText(item)}
        </Link>
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
