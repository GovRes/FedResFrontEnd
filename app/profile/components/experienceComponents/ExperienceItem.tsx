"use client";

import {
  AwardType,
  EducationType,
  ResumeType,
  SpecializedExperienceType,
  PastJobQualificationType,
  PastJobType,
  VolunteerType,
} from "@/app/utils/responseSchemas";
import styles from "./resumeStyles.module.css";
import { GrEdit, GrTrash } from "react-icons/gr";
import { useEffect, useState } from "react";
import { generateHeadingText } from "@/app/utils/stringBuilders";
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
    | PastJobQualificationType
    | VolunteerType;
  itemType: "Award" | "Education" | "PastJob" | "Volunteer";
  setItems: React.Dispatch<
    React.SetStateAction<
      Array<
        | AwardType
        | EducationType
        | SpecializedExperienceType
        | PastJobType
        | PastJobQualificationType
        | VolunteerType
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
    router.push(`/profile/${itemType.toLowerCase()}s/${item.id}/edit`);
  }

  return (
    <tr>
      <td className="tableData" role="cell">
        <Link href={`/profile/${itemType.toLowerCase()}s/${item.id}`}>
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
