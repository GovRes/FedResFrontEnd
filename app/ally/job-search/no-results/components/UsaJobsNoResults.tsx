import styles from "../ally.module.css";
import {
  agencies,
  positionScheduleType,
  travelPercentage,
} from "@/app/utils/usaJobsCodes";
import { JobSearchObject } from "@/app/utils/responseSchemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function UsaJobsNoResults({
  searchObject,
}: {
  searchObject: JobSearchObject;
}) {
  const router = useRouter();
  return (
    <div className={styles.noResultsContainer}>
      Unfortunately, your search returned no results. Here is what you searched:
      {searchObject.keyword && <p>Keyword: {searchObject.keyword}</p>}
      {searchObject.locationName && (
        <p>Location: {searchObject.locationName}</p>
      )}
      {searchObject.radius && <p>Radius: {searchObject.radius} miles</p>}
      {searchObject.organization && (
        <p>Organization: {agencies[searchObject.organization]}</p>
      )}
      {searchObject.positionTitle && (
        <p>Position Title: {searchObject.positionTitle}</p>
      )}
      {searchObject.positionScheduleType && (
        <p>
          Position Schedule Type:{" "}
          {
            positionScheduleType[
              searchObject.positionScheduleType as keyof typeof positionScheduleType
            ]
          }
        </p>
      )}
      {searchObject.remote && <p>Remote Only</p>}
      {searchObject.travelPercentage && (
        <p>
          Travel Percentage:{" "}
          {
            travelPercentage[
              searchObject.travelPercentage as keyof typeof travelPercentage
            ]
          }
        </p>
      )}
      {(searchObject.user["custom:veteran"] ||
        searchObject.user["custom:disabled"] ||
        searchObject.user["custom:militarySpouse"]) && (
        <div>
          <div>
            Additionally, we filtered based on the following information you
            provided in your profile. To change any of these, please{" "}
            <Link href="/profile">update your profile</Link> and search again.
          </div>
          <ul>
            {searchObject.user["custom:veteran"] && <li>You are a veteran</li>}
            {searchObject.user["custom:militarySpouse"] && (
              <li>You are a military spouse</li>
            )}
            {searchObject.user["custom:disabled"] && (
              <li>You have a disability</li>
            )}
          </ul>
        </div>
      )}
      <button
        onClick={() => router.push("/ally/job-search")}
        className={styles.backButton}
      >
        Back to search
      </button>
    </div>
  );
}
