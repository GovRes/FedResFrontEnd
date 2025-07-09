import { useEffect, useState } from "react";
// import UserItem from "./UserItem";
import { Loader } from "@/app/components/loader/Loader";
import { listModelRecords } from "@/app/crud/genericFetch";

export default function FederalJobsList() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const federalJobs = await listModelRecords("Job");
      console.log("Fetched federal jobs:", federalJobs);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <Loader text="Loading..." />; // Added missing return statement
  }

  return (
    <div>
      <table role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead">Name</th>
            <th className="tableHead">ID</th>
            <th className="tableHead">Delete</th>
          </tr>
        </thead>
        <tbody role="rowgroup"></tbody>
      </table>
    </div>
  );
}
