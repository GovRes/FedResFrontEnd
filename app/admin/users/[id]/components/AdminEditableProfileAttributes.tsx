import { useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import AdminEditableAttributeStringField from "./AdminEditableAttributeStringField";
import AdminEditableAttributeBooleanField from "./AdminEditableAttributeBooleanField";
import AdminEditableAttributeSelectField from "./AdminEditableAttributeSelectField";
import {
  academicLevels,
  agencies,
  federalEmploymentStatus,
} from "@/lib/utils/usaJobsCodes";
import AdminEditableAttributeCheckboxField from "./AdminEditableAttributeCheckboxField";
import { useRoles } from "@/lib/hooks/useRoles";
import { Loader } from "@/app/components/loader/Loader";
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
  const { roleOptions, loading: rolesLoading, error: rolesError } = useRoles();
  if (rolesLoading) {
    return (
      <div>
        <Loader text="loading roles" />
      </div>
    );
  }

  // Show error state if roles failed to load
  if (rolesError) {
    return (
      <div>
        <span>Error loading roles: {rolesError}</span>
      </div>
    );
  }

  return (
    <div>
      <h2>Edit User Profile (Admin)</h2>
      <div>
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
        <AdminEditableAttributeCheckboxField
          attributeKey="roles"
          currentlyEditing={currentlyEditing}
          title="Role"
          value={profile.roles}
          options={roleOptions}
          updateUser={updateUser}
          setCurrentlyEditing={setCurrentlyEditing}
        />
      </div>
    </div>
  );
}
