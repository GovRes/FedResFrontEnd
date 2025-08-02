import { useEffect, useState } from "react";
import ApplicationsTable from "./ApplicationsTable";
import { ApplicationType } from "@/lib/utils/responseSchemas";
import { Loader } from "../../../components/loader/Loader";
import { listUserApplications } from "@/lib/crud/application";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplicationDashboard() {
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthenticator();
  const router = useRouter();
  function startNewApplication() {
    sessionStorage.removeItem("applicationId");
    router.push(`/ally`);
  }
  useEffect(() => {
    async function getUserApplications() {
      setLoading(true);
      try {
        const applicationsRes = await listUserApplications({
          userId: user.userId,
        });
        setApplications(applicationsRes);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!applications.length && user) {
      getUserApplications();
    }
  }, [applications.length, user]);

  if (loading) {
    return <Loader text="Loading..." />;
  }
  if (applications.length === 0) {
    return (
      <div>
        Looks like you don't have any applications.{" "}
        <Link href="/ally">Start one?</Link>
      </div>
    );
  }
  return (
    <div>
      <ApplicationsTable
        applications={applications}
        setApplications={setApplications}
        setLoading={setLoading}
      />
      <button onClick={startNewApplication}>Start a new application</button>
    </div>
  );
}
