import { fetchUserAttributes } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import EditableProfileAttributes from "@/app/components/editableAttributes/EditableProfileAttributes";
import { toUserTypeFromCognito } from "@/app/utils/userAttributeUtils";
import { UserType } from "@/app/utils/userAttributeUtils";

export default function EditableAttributes() {
  const [attributes, setAttributes] = useState<UserType>({});
  useEffect(() => {
    fetchUserAttributes()
      .then((attrs) => toUserTypeFromCognito(attrs))
      .then((updatedAttrs) => setAttributes(updatedAttrs));
  }, []);
  return (
    <EditableProfileAttributes
      attributes={attributes}
      setAttributes={setAttributes}
    />
  );
}
