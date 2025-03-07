import styles from "../ally.module.css";
export default function UsaJobsNoResults({
  searchObject,
  setShowSearchForm,
}: {
  searchObject: any;
  setShowSearchForm: Function;
}) {
  //tk for selects, return values not keys
  return (
    <div className={styles.noResultsContainer}>
      Unfortunately, your search returned no results. Here is what you searched:
      {searchObject.keyword && <p>Keyword: {searchObject.keyword}</p>}
      {searchObject.locationName && (
        <p>Location: {searchObject.locationName}</p>
      )}
      {searchObject.radius && <p>Radius: {searchObject.radius}</p>}
      {searchObject.organization && (
        <p>Organization: {searchObject.organization}</p>
      )}
      {searchObject.positionTitle && (
        <p>Position Title: {searchObject.positionTitle}</p>
      )}
      {searchObject.positionScheduleType && (
        <p>Position Schedule Type: {searchObject.positionScheduleType}</p>
      )}
      {searchObject.remote && <p>Remote: {searchObject.remote}</p>}
      {searchObject.travelPercentage && (
        <p>Travel Percentage: {searchObject.travelPercentage}</p>
      )}
      <button onClick={() => setShowSearchForm(true)}>Back to search</button>
    </div>
  );
}
