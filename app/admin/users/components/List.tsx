import { useEffect, useState } from "react";
import ListTable from "./ListTable";
import { UserType } from "@/app/utils/userAttributeUtils";
import { listUserRecords } from "@/app/crud/user";
import { Loader } from "../../../components/loader/Loader";

export default function List() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getUserItems() {
      setLoading(true);
      try {
        // Use the explicit type parameter for fetchUserAssociations
        const usersRes = await listUserRecords();
        console.log("Fetched users:", usersRes);
        setUsers(usersRes.data);
      } catch (error) {
        console.error("Error fetching user items:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!users.length) {
      getUserItems();
    }
  }, [users.length]);

  if (loading) {
    return <Loader text="Loading..." />;
  }

  return (
    <div>
      <ListTable users={users} setUsers={setUsers} />
      {/* <Link href={`/profile/${pascalToDashed(experienceType)}s/new`}>
        <button>Add New {experienceType}</button>
      </Link> */}
    </div>
  );
}
