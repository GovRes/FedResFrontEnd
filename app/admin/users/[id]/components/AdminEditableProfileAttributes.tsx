import { useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import AdminEditableAttributeStringField from "./AdminEditableAttributeStringField";
import AdminEditableAttributeBooleanField from "./AdminEditableAttributeBooleanField";
import AdminEditableAttributeSelectField from "./AdminEditableAttributeSelectField";
import {
  academicLevels,
  agencies,
  federalEmploymentStatus,
} from "@/app/utils/usaJobsCodes";
// Import other admin field types as needed

interface AdminEditableProfileAttributesProps {
  profile: UserProfile;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
}

export default function AdminEditableProfileAttributes({
  profile,
  updateUser,
}: AdminEditableProfileAttributesProps) {
  const [currentlyEditing, setCurrentlyEditing] = useState<string | null>(null);

  return (
    <div className="admin-profile-editor">
      <h2>Edit User Profile (Admin)</h2>
      <div className="profile-fields">
        <AdminEditableAttributeStringField
          attributeKey="givenName"
          currentlyEditing={currentlyEditing}
          title="Given Name"
          value={profile.givenName}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />

        <AdminEditableAttributeStringField
          attributeKey="familyName"
          currentlyEditing={currentlyEditing}
          title="Family Name"
          value={profile.familyName}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />

        <AdminEditableAttributeStringField
          attributeKey="email"
          currentlyEditing={currentlyEditing}
          title="Email"
          value={profile.email}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />
        <AdminEditableAttributeBooleanField
          attributeKey="citizen"
          currentlyEditing={currentlyEditing}
          title="Are you a US Citizen?"
          value={profile.citizen ?? true}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />
        <AdminEditableAttributeBooleanField
          attributeKey="veteran"
          currentlyEditing={currentlyEditing}
          title="Are you a veteran?"
          value={profile.veteran ?? false}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />
        <AdminEditableAttributeBooleanField
          attributeKey="militarySpouse"
          currentlyEditing={currentlyEditing}
          title="Are you a military spouse?"
          value={profile.militarySpouse ?? false}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />
        <AdminEditableAttributeBooleanField
          attributeKey="disabled"
          currentlyEditing={currentlyEditing}
          title="Are you an individual with a disability?"
          value={profile.disabled ?? false}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />

        <AdminEditableAttributeSelectField
          attributeKey="academicLevel"
          currentlyEditing={currentlyEditing}
          title="Highest level of education completed"
          value={profile.academicLevel ?? ""}
          options={academicLevels}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />
        <AdminEditableAttributeSelectField
          attributeKey="fedEmploymentStatus"
          currentlyEditing={currentlyEditing}
          title="Are you curently a federal employee?"
          value={profile.fedEmploymentStatus ?? ""}
          options={federalEmploymentStatus}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />
        {profile.fedEmploymentStatus === "CURRENT-FED" && (
          <AdminEditableAttributeSelectField
            attributeKey="currentAgency"
            currentlyEditing={currentlyEditing}
            title="If so, what is your current Agency"
            value={profile.currentAgency ?? ""}
            options={agencies}
            updateUser={updateUser}
            setCurrentlyEditing={setCurrentlyEditing}
          />
        )}
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-2 bg-gray-100 text-xs">
          <strong>Debug:</strong> Currently editing:{" "}
          {currentlyEditing || "none"}
          <br />
          <strong>Profile ID:</strong> {profile.id}
          <br />
          <strong>Cognito ID:</strong> {profile.owner}
        </div>
      )}
    </div>
  );
}
