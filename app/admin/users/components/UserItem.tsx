"use client";

import { UserType } from "@/app/utils/userAttributeUtils";
// import styles from "./resumeStyles.module.css";
import { GrEdit, GrTrash } from "react-icons/gr";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserItem({
  user,
  setUsers,
}: {
  user: UserType;

  setUsers: React.Dispatch<React.SetStateAction<Array<UserType>>>;
}) {
  const router = useRouter();
  async function deleteItem() {
    setUsers((prevItems) =>
      prevItems.filter((prevItem) => prevItem.id !== user.id)
    );
    try {
      // await deleteModelRecord(itemType, user.id);
    } catch (error) {
      setUsers((prevItems) => [...prevItems, user]);
      console.error(`Error deleting user with ID ${user.id}:`, error);
    }
  }

  function editItem() {
    router.push(`/admin/users/${user.id}/edit`);
  }
  return (
    <tr>
      <td className="tableData" role="cell">
        <Link href={`/admin/users/${user.id}`}>
          {user.givenName} {user.familyName}
        </Link>
      </td>
      <td className="tableData" role="cell">
        <span onClick={editItem}>
          <GrEdit />
        </span>
      </td>
      <td className="tableData" role="cell">
        <span onClick={deleteItem}>
          <GrTrash />
        </span>
      </td>
    </tr>
  );
}
