"use client";
import ApplicationDashboard from "../profile/applications/applicationComponents/ApplicationsDashboard";
import { useApplication } from "../providers/applicationContext";
import { useRouter } from "next/navigation";

export default function AllyPage() {
  const { resetApplication } = useApplication();
  const router = useRouter();

  const handleNewApplication = () => {
    resetApplication();
    router.push("/ally/usa-jobs");
  };

  return (
    <div>
      <h2>Ally Home Content</h2>
      <ApplicationDashboard />
      <button onClick={handleNewApplication}>Start a new application</button>
    </div>
  );
}
