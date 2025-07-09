import { useState, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource"; // Adjust path as needed

const client = generateClient<Schema>();

// Type that matches your schema
type User = Schema["User"]["type"];

export const useUserOperations = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);

  const loadAllUsers = useCallback(async () => {
    setAllUsersLoading(true);
    try {
      const { data: users, errors } = await client.models.User.list();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      setAllUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setAllUsersLoading(false);
    }
  }, []);

  const deleteUserWithNotification = useCallback(async (userId: string) => {
    try {
      const { data: deletedUser, errors } = await client.models.User.delete({
        id: userId,
      });

      if (errors) {
        console.error("GraphQL errors:", errors);
        throw new Error("Failed to delete user");
      }

      // Update the state by removing the deleted user
      setAllUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId)
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }, []);

  const deactivateUserWithNotification = useCallback(async (userId: string) => {
    try {
      const { data: updatedUser, errors } = await client.models.User.update({
        id: userId,
        isActive: false,
        updatedAt: new Date().toISOString(),
      });

      if (errors) {
        console.error("GraphQL errors:", errors);
        throw new Error("Failed to deactivate user");
      }

      // Update the state by modifying the user's active status
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, isActive: false, updatedAt: new Date().toISOString() }
            : user
        )
      );
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }, []);

  const reactivateUserWithNotification = useCallback(async (userId: string) => {
    try {
      const { data: updatedUser, errors } = await client.models.User.update({
        id: userId,
        isActive: true,
        updatedAt: new Date().toISOString(),
      });

      if (errors) {
        console.error("GraphQL errors:", errors);
        throw new Error("Failed to reactivate user");
      }

      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, isActive: true, updatedAt: new Date().toISOString() }
            : user
        )
      );
    } catch (error) {
      console.error("Error reactivating user:", error);
      throw error;
    }
  }, []);

  return {
    allUsers,
    allUsersLoading,
    loadAllUsers,
    deleteUserWithNotification,
    deactivateUserWithNotification,
    reactivateUserWithNotification,
  };
};
