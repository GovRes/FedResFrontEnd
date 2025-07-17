import EditableProfileAttributes from "@/app/profile/editableAttributes/EditableProfileAttributes";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function EditableAttributes() {
  const { profile, updateProfile } = useCurrentUser();

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="info-box">
        <div>
          <strong>Why We Ask for This Information</strong>
        </div>{" "}
        <div>
          Filling out your profile helps us show you jobs you may be eligible
          for. If you leave out key information or don’t meet the listed
          requirements, you won’t be considered for certain jobs—even if you
          apply.
        </div>
      </div>
      <EditableProfileAttributes
        attributes={profile}
        updateProfile={updateProfile}
      />
    </div>
  );
}
