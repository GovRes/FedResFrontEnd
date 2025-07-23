"use client";

import { UserType } from "@/app/utils/userAttributeUtils";
import { GrStarOutline, GrTrash } from "react-icons/gr";
import NavigationLink from "@/app/components/loader/NavigationLink";
import styles from "./userTableStyles.module.css"; // Adjust the path as needed

export default function UserItem({
  user,
  onDelete,
  onReactivate,
}: {
  user: UserType;
  onDelete: (userId: string) => Promise<void>;
  onReactivate: (userId: string) => Promise<void>;
}) {
  async function deleteItem() {
    try {
      await onDelete(user.id);
    } catch (error) {
      console.error(`Error deleting user with ID ${user.id}:`, error);
    }
  }

  async function reactivateItem() {
    try {
      await onReactivate(user.id);
    } catch (error) {
      console.error(`Error reactivating user with ID ${user.id}:`, error);
    }
  }

  return (
    <tr className={user.isActive ? `` : styles.tableRowInactive} role="row">
      <td className="tableData" role="cell">
        <NavigationLink href={`/admin/users/${user.id}`}>
          {user.givenName} {user.familyName}
        </NavigationLink>
      </td>
      <td className="tableData" role="cell">
        {user.id}
      </td>
      <td className="tableData" role="cell">
        {user.isActive ? (
          <span onClick={deleteItem} style={{ cursor: "pointer" }}>
            <GrTrash />
          </span>
        ) : (
          <span onClick={reactivateItem} style={{ cursor: "pointer" }}>
            <GrStarOutline />
          </span>
        )}
      </td>
    </tr>
  );
}
