import Link from "next/link";
import { GrTrash } from "react-icons/gr";
import { JobType } from "@/lib/utils/responseSchemas";

export default function FederalJobItem({
  job,
  onDelete,
}: {
  job: JobType;
  onDelete: (userId: string) => Promise<void>;
}) {
  async function deleteItem() {
    if (job.id) {
      try {
        await onDelete(job.id);
      } catch (error) {
        console.error(`Error deleting user with ID ${job.id}:`, error);
      }
    }
  }

  return (
    <tr role="row">
      <td className="tableData" role="cell">
        <Link href={`/admin/federal-jobs/${job.id}`}>
          {job.title} at {job.department}
        </Link>
      </td>
      <td className="tableData" role="cell">
        <span onClick={deleteItem} style={{ cursor: "pointer" }}>
          <GrTrash />
        </span>
      </td>
    </tr>
  );
}
