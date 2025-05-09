"use client";

import { ApplicationType } from "@/app/utils/responseSchemas";
import { GrTrash } from "react-icons/gr";
import { deleteModelRecord } from "@/app/crud/genericDelete";
import { useRouter } from "next/navigation";

export default function ApplicationItem({
  application,
  setApplications,
}: {
  application: ApplicationType;
  setApplications: React.Dispatch<React.SetStateAction<Array<ApplicationType>>>;
}) {
  const router = useRouter();
  async function deleteApplication() {
    setApplications((prevItems) =>
      prevItems.filter((prevItem) => prevItem.id !== application.id)
    );
    try {
      await deleteModelRecord("Application", application.id);
    } catch (error) {
      setApplications((prevItems) => [...prevItems, application]);
      console.error(
        `Error deleting Application with ID ${application.id}:`,
        error
      );
    }
  }

  const setApplication = async () => {
    sessionStorage.setItem("applicationId", application.id.toString());
    // Add a 2-second wait before navigation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push("/ally");
  };

  return (
    <tr>
      <td className="tableData" role="cell">
        Application for {application.job.title} at {application.job.department}
      </td>
      <td>{application.status}</td>
      <td className="tableData" role="cell">
        <button onClick={setApplication}>Continue Application</button>
      </td>
      <td className="tableData" role="cell">
        <span onClick={deleteApplication}>
          <GrTrash />
        </span>
      </td>
    </tr>
  );
}
