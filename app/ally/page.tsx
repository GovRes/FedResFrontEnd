"use client";
import ApplicationDashboard from "../profile/applications/applicationComponents/ApplicationsDashboard";
import { useApplication } from "../providers/applicationContext";
export default function AllyPage() {
  const { resetApplication } = useApplication();
  return (
    <div>
      <h2>Ally Home Content</h2>
      <ApplicationDashboard />
      <button onClick={() => resetApplication()}>
        Start a new application
      </button>
    </div>
  );
}
