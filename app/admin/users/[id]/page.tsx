"use client"; // Ensure this is at the top for client-side rendering
import { use, useEffect, useState } from "react";
import EditableProfileAttributes from "@/app/components/editableAttributes/EditableProfileAttributes";
import { UserType } from "@/app/utils/userAttributeUtils";
import { fetchUserRecord } from "@/app/crud/user";

export default function EditableUserRecord({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [attributes, setAttributes] = useState<UserType>({});
  useEffect(() => {
    async function fetchUserAttributes() {
      const userAttributes = await fetchUserRecord(id);
      if (userAttributes) {
        setAttributes(userAttributes);
      }
    }
    fetchUserAttributes();
  }, []);
  return (
    <EditableProfileAttributes
      attributes={attributes}
      setAttributes={setAttributes}
    />
  );
}
