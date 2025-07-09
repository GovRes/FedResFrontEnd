"use client";
import { use, useEffect, useState } from "react";
import AdminEditableProfileAttributes from "./components/AdminEditableProfileAttributes";
import { Loader } from "@/app/components/loader/Loader";
import { useUserManagement } from "@/lib/hooks/useUserManagement";

export default function EditableUserRecord({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { loading, loadUserById, profile, updateUser, error } =
    useUserManagement();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (id && !isInitialized) {
      loadUserById(id)
        .then(() => {
          setIsInitialized(true);
        })
        .catch((err) => {
          console.error("Error loading user for admin:", err);
          setIsInitialized(true);
        });
    }
  }, [id, loadUserById, isInitialized]);
  if (error) {
    return (
      <div>
        <h2>Error Loading User</h2>
        <p>{error}</p>
        <button
          onClick={() => {
            setIsInitialized(false);
            loadUserById(id);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (loading || !isInitialized) {
    return <Loader text="Loading User for Admin Edit" />;
  }

  // Show no user found state
  if (!profile) {
    return (
      <div>
        <h2>User Not Found</h2>
        <p>No user found with database ID: {id}</p>
        <button
          onClick={() => {
            setIsInitialized(false);
            loadUserById(id);
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Successfully loaded user for admin editing
  return (
    <div>
      <AdminEditableProfileAttributes
        profile={profile}
        updateUser={updateUser}
      />
    </div>
  );
}
