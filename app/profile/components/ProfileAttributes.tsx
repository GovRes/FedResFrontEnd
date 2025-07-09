import EditableProfileAttributes from "@/app/profile/editableAttributes/EditableProfileAttributes";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function EditableAttributes() {
  const { profile, updateProfile } = useCurrentUser();

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
