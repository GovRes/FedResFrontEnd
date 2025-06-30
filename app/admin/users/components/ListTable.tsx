// import styles from "../../resumes/resumeComponents/resumeStyles.module.css";
import { UserType } from "@/app/utils/userAttributeUtils";
import UserItem from "./UserItem";

export default function ListTable({
  users,
  setUsers,
}: {
  users: UserType[];
  setUsers: React.Dispatch<React.SetStateAction<Array<UserType>>>;
}) {
  return (
    <div>
      <table role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead">Name</th>
            <th className="tableHead"></th>
            <th className="tableHead"></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {users &&
            users.map((user: UserType) => (
              <UserItem key={user.id} user={user} setUsers={setUsers} />
            ))}
        </tbody>
      </table>
    </div>
  );
}
