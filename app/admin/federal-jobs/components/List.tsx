"use client";
import { useEffect, useState } from "react";
// import UserItem from "./UserItem";
import { Loader } from "@/app/components/loader/Loader";
import { listModelRecords } from "@/lib/crud/genericFetch";
import FederalJobItem from "./FederalJobItem";
import { deleteModelRecord } from "@/lib/crud/genericDelete";
import { JobType } from "@/lib/utils/responseSchemas";

export default function FederalJobsList() {
  const [loading, setLoading] = useState(true);
  const [federalJobs, setFederalJobs] = useState<JobType[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const federalJobs = await listModelRecords("Job");
      setFederalJobs(federalJobs.items);
      setLoading(false);
    }
    fetchData();
  }, []);

  async function deleteJob(jobId: string) {
    await deleteModelRecord("Job", jobId);
    setFederalJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
  }

  if (loading) {
    return <Loader text="Loading..." />; // Added missing return statement
  }

  return (
    <div>
      <table role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead">Name</th>
            <th className="tableHead">Delete</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {federalJobs.map((job) => (
            <FederalJobItem key={job.id} job={job} onDelete={deleteJob} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
