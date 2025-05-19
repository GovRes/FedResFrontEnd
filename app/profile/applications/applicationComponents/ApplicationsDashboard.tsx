import { useEffect, useState } from "react";
import ApplicationsTable from "./ApplicationsTable";
import { ApplicationType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "../../../components/loader/Loader";
import { listUserApplications } from "@/app/crud/application";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";

export default function ApplicationDashboard() {
  const [applications, setApplications] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthenticator();
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
    return <TextBlinkLoader text="Loading..." />;
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
      />
    </div>
  );
}
