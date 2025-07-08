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
    console.log("Admin page mounted with database ID:", id);
    if (id && !isInitialized) {
      console.log("Loading user for admin editing:", id);
      loadUserById(id)
        .then(() => {
          console.log("User load completed for admin");
          setIsInitialized(true);
        })
        .catch((err) => {
          console.error("Error loading user for admin:", err);
          setIsInitialized(true);
        });
    }
  }, [id, loadUserById, isInitialized]);

  // Show error state
  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">
          Error Loading User
        </h2>
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => {
            setIsInitialized(false);
            loadUserById(id);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
      <div className="p-4">
        <h2 className="text-xl font-bold text-yellow-600 mb-2">
          User Not Found
        </h2>
        <p className="text-yellow-500">No user found with database ID: {id}</p>
        <button
          onClick={() => {
            setIsInitialized(false);
            loadUserById(id);
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
