"use client";

import { ApplicationType } from "@/app/utils/responseSchemas";
import { GrTrash } from "react-icons/gr";
import { useRouter } from "next/navigation";
import { deleteApplication } from "@/app/crud/application";
import { broadcastApplicationReset } from "@/app/providers/applicationContext";
import { useLoading } from "@/app/providers/loadingContext";

export default function ApplicationItem({
  application,
  setApplications,
  setLoading,
}: {
  application: ApplicationType;
  setApplications: React.Dispatch<React.SetStateAction<Array<ApplicationType>>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const { setIsLoading } = useLoading();
  async function deleteApp() {
    try {
      setLoading(true);
      await deleteApplication({ applicationId: application.id });
      sessionStorage.removeItem("applicationId");
      broadcastApplicationReset();
      setApplications((prevItems) =>
        prevItems.filter((prevItem) => prevItem.id !== application.id)
      );
      setLoading(false);
    } catch (error) {
      console.error(
        `Error deleting Application with ID ${application.id}:`,
        error
      );
      setLoading(false);
    }
  }

  const setApplication = () => {
    // Set the applicationId in sessionStorage
    sessionStorage.setItem("applicationId", application.id.toString());

    // Trigger the custom event to notify layout that sessionStorage has changed
    const event = new CustomEvent("applicationIdChanged");
    window.dispatchEvent(event);
    setIsLoading(true);
    // Navigate to the ally page
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
        <span onClick={deleteApp}>
          <GrTrash />
        </span>
      </td>
    </tr>
  );
}
