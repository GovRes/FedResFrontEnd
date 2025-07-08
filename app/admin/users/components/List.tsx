import { useUserOperations } from "@/lib/hooks/useUserOperations";
import { useEffect } from "react";
import UserItem from "./UserItem";
import { Loader } from "@/app/components/loader/Loader";

export default function UserList() {
  const {
    allUsers,
    allUsersLoading,
    loadAllUsers,
    deactivateUserWithNotification,
    reactivateUserWithNotification,
  } = useUserOperations();

  // Debug: Log when component re-renders and current user count
  console.log("UserList rendered with", allUsers.length, "users");

  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  if (allUsersLoading) {
    return <Loader text="Loading..." />; // Added missing return statement
  }

  return (
    <div>
      <table role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead">Name</th>
            <th className="tableHead">ID</th>
            <th className="tableHead">Delete</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {allUsers.map((user) => (
            <UserItem
              key={user.id}
              user={user}
              onDelete={deactivateUserWithNotification}
              onReactivate={reactivateUserWithNotification}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
