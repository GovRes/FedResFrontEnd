"use client";
import ApplicationDashboard from "../profile/applications/applicationComponents/ApplicationsDashboard";
import { useApplication } from "../providers/applicationContext";
import { useRouter } from "next/navigation";
import { useLoading } from "../providers/loadingContext";

export default function AllyPage() {
  const { resetApplication } = useApplication();
  const router = useRouter();
  const { setIsLoading } = useLoading();
  const handleNewApplication = () => {
    resetApplication();
    setIsLoading(true);
    router.push("/ally/job-search");
  };

  return (
    <div>
      <h2>Ally Home Content</h2>
      <ApplicationDashboard />
      <button onClick={handleNewApplication}>Start a new application</button>
    </div>
  );
}
