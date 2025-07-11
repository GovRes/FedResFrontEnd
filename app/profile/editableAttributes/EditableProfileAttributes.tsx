"use client";

import EditableAttributeStringField from "./EditableAttributeStringField";
import EditableAttributeSelectField from "./EditableAttributeSelectField";
import {
  academicLevels,
  agencies,
  federalEmploymentStatus,
} from "@/app/utils/usaJobsCodes";
import EditableAttributeBooleanField from "./EditableAttributeBooleanField";
import EditableAttributeEmailField from "./EditableAttributeEmailField";
import { useState } from "react";
import { UserType } from "@/app/utils/userAttributeUtils";

export default function EditableProfileAttributes({
  attributes,
  updateProfile,
}: {
  attributes: UserType;
  updateProfile: (updates: Partial<UserType>) => Promise<boolean>;
}) {
  const [currentlyEditing, setCurrentlyEditing] = useState<string | null>(null);
  return (
    <div>
      <h1>Profile</h1>
      <EditableAttributeStringField
        attributeKey="givenName"
        currentlyEditing={currentlyEditing}
        title="First Name"
        value={attributes.givenName ?? ""}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeStringField
        attributeKey="familyName"
        currentlyEditing={currentlyEditing}
        title="Last Name"
        value={attributes.familyName ?? ""}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeEmailField
        attributeKey="email"
        currentlyEditing={currentlyEditing}
        title="Email"
        value={attributes.email || ""}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeBooleanField
        attributeKey="citizen"
        currentlyEditing={currentlyEditing}
        title="Are you a US Citizen?"
        value={attributes.citizen ?? true}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeBooleanField
        attributeKey="veteran"
        currentlyEditing={currentlyEditing}
        title="Are you a veteran?"
        value={attributes.veteran ?? false}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeBooleanField
        attributeKey="militarySpouse"
        currentlyEditing={currentlyEditing}
        title="Are you a military spouse?"
        value={attributes.militarySpouse ?? false}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeBooleanField
        attributeKey="disabled"
        currentlyEditing={currentlyEditing}
        title="Are you an individual with a disability?"
        value={attributes.disabled ?? false}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeSelectField
        attributeKey="academicLevel"
        currentlyEditing={currentlyEditing}
        title="Highest level of education completed"
        value={attributes.academicLevel ?? ""}
        options={academicLevels}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      <EditableAttributeSelectField
        attributeKey="fedEmploymentStatus"
        currentlyEditing={currentlyEditing}
        title="Are you curently a federal employee?"
        value={attributes.fedEmploymentStatus ?? ""}
        options={federalEmploymentStatus}
        setAttributes={updateProfile}
        setCurrentlyEditing={setCurrentlyEditing}
      />
      {attributes.fedEmploymentStatus === "CURRENT-FED" && (
        <EditableAttributeSelectField
          attributeKey="currentAgency"
          currentlyEditing={currentlyEditing}
          title="If so, what is your current Agency"
          value={attributes.currentAgency ?? ""}
          options={agencies}
          setAttributes={updateProfile}
          setCurrentlyEditing={setCurrentlyEditing}
        />
      )}
      <div>
        For definitions of the above terms see{" "}
        <a href="https://help.usajobs.gov/how-to/account/profile/hiring-paths">
          the USAJOBS Hiring Paths
        </a>{" "}
        page
      </div>
    </div>
  );
}
