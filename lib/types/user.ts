// src/lib/types/user.ts

// Helper type to handle Amplify's Nullable arrays
type SafeStringArray = string[] | null | undefined;

export interface UserProfile {
  id: string;
  owner: string | null;
  email: string;
  givenName?: string | null;
  familyName?: string | null;
  academicLevel?: string | null;
  birthdate?: string | null;
  citizen?: boolean | null;
  currentAgency?: string | null;
  disabled?: boolean | null;
  fedEmploymentStatus?: string | null;
  gender?: string | null;
  militarySpouse?: boolean | null;
  veteran?: boolean | null;
  groups?: SafeStringArray;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Interface for updating user data (excludes system fields)
export interface UserUpdateData {
  givenName?: string | null;
  familyName?: string | null;
  academicLevel?: string | null;
  birthdate?: string | null;
  citizen?: boolean | null;
  currentAgency?: string | null;
  disabled?: boolean | null;
  fedEmploymentStatus?: string | null;
  gender?: string | null;
  militarySpouse?: boolean | null;
  veteran?: boolean | null;
  groups?: string[];
  isActive?: boolean;
}

// Type for admin operations
export interface AdminUserUpdate extends UserUpdateData {
  email?: string;
}
