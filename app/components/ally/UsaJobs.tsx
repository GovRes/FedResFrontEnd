import { useState } from "react";
import UsaJobsSearch from "./usaJobsComponents/UsaJobsSearch";
import UsaJobsResults from "./usaJobsComponents/UsaJobsResults";
import UsaJobsNoResults from "./usaJobsComponents/UsaJobsNoResults";

export default function UsaJobs() {
  const [showSearchForm, setShowSearchForm] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchObject, setSearchObject] = useState({
    keyword: undefined,
    locationName: undefined,
    organization: undefined,
    positionTitle: undefined,
    positionScheduleType: undefined,
    radius: undefined,
    remote: undefined,
    travelPercentage: undefined,
  });

  if (showSearchForm) {
    return (
      <UsaJobsSearch
        searchObject={searchObject}
        setSearchObject={setSearchObject}
        setSearchResults={setSearchResults}
        setShowSearchForm={setShowSearchForm}
      />
    );
  } else if (searchResults.length === 0) {
    return (
      <UsaJobsNoResults
        searchObject={searchObject}
        setShowSearchForm={setShowSearchForm}
      />
    );
  } else {
    return (
      <UsaJobsResults
        searchResults={searchResults}
        setShowSearchForm={setShowSearchForm}
      />
    );
  }
}
