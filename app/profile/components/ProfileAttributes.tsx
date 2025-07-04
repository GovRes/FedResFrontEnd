import { fetchUserAttributes } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import EditableProfileAttributes from "@/app/components/editableAttributes/EditableProfileAttributes";
import { toUserTypeFromCognito } from "@/app/utils/userAttributeUtils";
import { UserType } from "@/app/utils/userAttributeUtils";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function EditableAttributes() {
  const { profile, updateProfile } = useCurrentUser();
  console.log("Editable atr", profile);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <EditableProfileAttributes
      attributes={profile}
      updateProfile={updateProfile}
    />
  );
}
