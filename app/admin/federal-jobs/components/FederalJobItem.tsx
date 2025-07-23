"use client";
import { GrTrash } from "react-icons/gr";
import NavigationLink from "@/app/components/loader/NavigationLink";
import { JobType } from "@/app/utils/responseSchemas";

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
        <NavigationLink href={`/admin/federal-jobs/${job.id}`}>
          {job.title} at {job.department}
        </NavigationLink>
      </td>
      <td className="tableData" role="cell">
        <span onClick={deleteItem} style={{ cursor: "pointer" }}>
          <GrTrash />
        </span>
      </td>
    </tr>
  );
}
