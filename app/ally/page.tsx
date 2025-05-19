"use client";
import ApplicationDashboard from "../profile/applications/applicationComponents/ApplicationsDashboard";
import { useApplication } from "../providers/applicationContext";
import { useRouter } from "next/navigation";

export default function AllyPage() {
  const { resetApplication } = useApplication();
  const router = useRouter();

  const handleNewApplication = () => {
    // Clear the applicationId in sessionStorage
    sessionStorage.removeItem("applicationId");

    // Trigger the custom event to notify layout that sessionStorage has changed
    const event = new CustomEvent("applicationIdChanged");
    window.dispatchEvent(event);

    // Call the context's resetApplication function
    resetApplication();

    // Force a reload of the current page to ensure state is refreshed
    router.refresh();
  };

  return (
    <div>
      <h2>Ally Home Content</h2>
      <ApplicationDashboard />
      <button onClick={handleNewApplication}>Start a new application</button>
    </div>
  );
}
