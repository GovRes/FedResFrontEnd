import { GrFavorite } from "react-icons/gr";
import { MatchedObjectDescriptor } from "./UsaJobsResults";

export default function UsaJobsResultsItem({
  job,
  selectJob,
}: {
  job: MatchedObjectDescriptor;
  selectJob: Function;
}) {
  function setJob() {
    selectJob({ job: job });
  }
  return (
    <tr>
      <td className="tableData" role="cell">
        <button onClick={setJob}>Apply for this job</button>
      </td>
      <td className="tableData" role="cell">
        <GrFavorite />
      </td>
      <td className="tableData" role="cell">
        {job.PositionTitle}
      </td>
      <td className="tableData" role="cell">
        {job.DepartmentName}
      </td>
      <td className="tableData" role="cell">
        ${job.PositionRemuneration[0].MinimumRange} - $
        {job.PositionRemuneration[0].MaximumRange} (
        {job.PositionRemuneration[0].Description})
      </td>
      <td className="tableData" role="cell">
        {job.PositionLocation[0].LocationName}
      </td>
      <td className="tableData" role="cell">
        <a href={job.PositionURI} target="_blank">
          Learn More
        </a>
      </td>
    </tr>
  );
}
