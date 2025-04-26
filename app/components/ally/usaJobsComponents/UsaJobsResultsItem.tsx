import { GrFavorite } from "react-icons/gr";
import { Result } from "./UsaJobsResults";
import { formatSalary } from "@/app/utils/numberFormating";

export default function UsaJobsResultsItem({
  job,
  selectJob,
}: {
  job: Result;
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
        {job.MatchedObjectDescriptor.PositionTitle}
      </td>
      <td className="tableData" role="cell">
        {job.MatchedObjectDescriptor.DepartmentName}
      </td>
      <td className="tableData" role="cell">
        {formatSalary(
          job.MatchedObjectDescriptor.PositionRemuneration[0].MinimumRange
        )}{" "}
        -{" "}
        {formatSalary(
          job.MatchedObjectDescriptor.PositionRemuneration[0].MaximumRange
        )}{" "}
        ({job.MatchedObjectDescriptor.PositionRemuneration[0].Description})
      </td>
      <td className="tableData" role="cell">
        {job.MatchedObjectDescriptor.PositionLocation[0].LocationName}
      </td>
      <td className="tableData" role="cell">
        <a href={job.MatchedObjectDescriptor.PositionURI} target="_blank">
          Learn More
        </a>
      </td>
    </tr>
  );
}
