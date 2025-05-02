import {
  fetchUserAttributes,
  FetchUserAttributesOutput,
} from "aws-amplify/auth";
import { useEffect, useState } from "react";
import ProfileAttributeStringField from "./profileAttributeFields/ProfileAttributeStringField";
import ProfileAttributeDateField from "./profileAttributeFields/ProfileAttributeDateField";
import ProfileAttributeSelectField from "./profileAttributeFields/ProfileAttributeSelectField";
import {
  academicLevels,
  agencies,
  federalEmploymentStatus,
  gender,
} from "@/app/utils/usaJobsCodes";
import ProfileAttributeBooleanField from "./profileAttributeFields/ProfileAttributeBooleanField";
import ProfileAttributeEmailField from "./profileAttributeFields/ProfileAttributeEmailField";

export default function ProfileAttributes() {
  const [attributes, setAttributes] = useState<FetchUserAttributesOutput>({});

  useEffect(() => {
    fetchUserAttributes().then(setAttributes);
  }, []);
  return (
    <div>
      <h1>Profile</h1>
      <ProfileAttributeStringField
        attributeKey="given_name"
        title="First Name"
        value={attributes.given_name || ""}
        setAttributes={setAttributes}
      />
      <ProfileAttributeStringField
        attributeKey="family_name"
        title="Last Name"
        value={attributes.family_name || ""}
        setAttributes={setAttributes}
      />
      <ProfileAttributeEmailField
        attributeKey="email"
        title="Email"
        value={attributes.email || ""}
        setAttributes={setAttributes}
      />
      <ProfileAttributeBooleanField
        attributeKey="custom:citizen"
        title="Are you a US Citizen?"
        value={attributes["custom:citizen"] || "true"}
        setAttributes={setAttributes}
      />
      <ProfileAttributeBooleanField
        attributeKey="custom:veteran"
        title="Are you a veteran?"
        value={attributes["custom:veteran"] || "false"}
        setAttributes={setAttributes}
      />
      <ProfileAttributeBooleanField
        attributeKey="custom:militarySpouse"
        title="Are you a military spouse?"
        value={attributes["custom:militarySpouse"] || "false"}
        setAttributes={setAttributes}
      />
      <ProfileAttributeBooleanField
        attributeKey="custom:disabled"
        title="Are you an individual with a disability?"
        value={attributes["custom:disabled"] || "false"}
        setAttributes={setAttributes}
      />
      <ProfileAttributeSelectField
        attributeKey="custom:academicLevel"
        title="Highest level of education completed"
        value={attributes["custom:academicLevel"] || ""}
        options={academicLevels}
        setAttributes={setAttributes}
      />
      <ProfileAttributeSelectField
        attributeKey="custom:fedEmploymentStatus"
        title="Are you curently a federal employee?"
        value={attributes["custom:fedEmploymentStatus"] || ""}
        options={federalEmploymentStatus}
        setAttributes={setAttributes}
      />
      {attributes["custom:fedEmploymentStatus"] === "CURRENT-FED" && (
        <ProfileAttributeSelectField
          attributeKey="custom:currentAgency"
          title="If so, what is your current Agency"
          value={attributes["custom:currentAgency"] || ""}
          options={agencies}
          setAttributes={setAttributes}
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
