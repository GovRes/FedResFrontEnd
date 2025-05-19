"use client";

import { ApplicationType } from "@/app/utils/responseSchemas";
import { GrTrash } from "react-icons/gr";
import { deleteModelRecord } from "@/app/crud/genericDelete";
import { useRouter } from "next/navigation";
import { deleteApplication } from "@/app/crud/application";
import { useState } from "react";
import { TextBlinkLoader } from "@/app/components/loader/Loader";

export default function ApplicationItem({
  application,
  setApplications,
}: {
  application: ApplicationType;
  setApplications: React.Dispatch<React.SetStateAction<Array<ApplicationType>>>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteApp() {
    setApplications((prevItems) =>
      prevItems.filter((prevItem) => prevItem.id !== application.id)
    );
    try {
      setLoading(true);
      await deleteApplication({ applicationId: application.id });
      setLoading(false);
    } catch (error) {
      setApplications((prevItems) => [...prevItems, application]);
      console.error(
        `Error deleting Application with ID ${application.id}:`,
        error
      );
    }
  }

  const setApplication = () => {
    // Set the applicationId in sessionStorage
    sessionStorage.setItem("applicationId", application.id.toString());

    // Trigger the custom event to notify layout that sessionStorage has changed
    const event = new CustomEvent("applicationIdChanged");
    window.dispatchEvent(event);

    // Navigate to the ally page
    router.push("/ally");
  };

  if (loading) {
    return <TextBlinkLoader text="Deleting..." />;
  }

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
