"use client";
import React, { useContext, useState } from "react";
import UsaJobsResultsItem from "./UsaJobsResultsItem";
import styles from "../ally.module.css";
import { createAndSaveJob } from "@/app/crud/job";
import Modal from "../../modal/Modal";
import { AllyContext } from "@/app/providers";
import { formatJobDescription } from "@/app/utils/usaJobsSearch";
import indefiniteArticle from "@/app/utils/indefiniteArticles";
import { createAndSaveUserResume } from "@/app/crud/userResume";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
export interface MatchedObjectDescriptor {
  PositionTitle: string;
  DepartmentName: string;
  PositionURI: string;
  PositionRemuneration: {
    Description: string;
    MaximumRange: number;
    MinimumRange: number;
  }[];
  PositionLocation: {
    LocationName: string;
  }[];
  QualificationSummary: string;
  UserArea: {
    Details: {
      AgencyMarketingStatement: string;
      Evaluations: string;
      MajorDuties: string[];
      RequiredDocuments: string;
    };
  };
}

export interface Result {
  MatchedObjectId: string;
  MatchedObjectDescriptor: MatchedObjectDescriptor;
}

export default function UsaJobsResults({
  searchResults,
  setShowSearchForm,
}: {
  searchResults: Result[];
  setShowSearchForm: Function;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { setUserResumeId } = context;
  const router = useRouter();
  const { user } = useAuthenticator();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<Result | null>();
  function selectJob({ job }: { job: Result }) {
    setModalOpen(true);
    setCurrentJob(job);
  }
  function returnToSearch() {
    setShowSearchForm(true);
    window.scrollTo(0, 0);
  }
  async function setJobAndProceed() {
    if (currentJob) {
      setModalOpen(false);

      let formattedJobDescription = formatJobDescription({ job: currentJob });
      let jobRes = await createAndSaveJob({ ...formattedJobDescription });
      let userResumeRes = await createAndSaveUserResume({
        jobId: jobRes.id,
        userId: user.userId,
      });
      setUserResumeId(userResumeRes.id);
      router.push("/ally/specialized_experience");
    }
  }

  return (
    <div className={styles.resultsContainer}>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {currentJob && (
          <>
            <div>
              You want apply for{" "}
              {currentJob.MatchedObjectDescriptor.PositionTitle}, correct?
            </div>
            <button onClick={setJobAndProceed}>
              Yes, let's apply to be{" "}
              {indefiniteArticle({
                phrase: currentJob.MatchedObjectDescriptor.PositionTitle,
              })}{" "}
              {currentJob?.MatchedObjectDescriptor.PositionTitle}!
            </button>
            <button onClick={() => setModalOpen(false)}>
              No, please take me back to the search results.
            </button>
          </>
        )}
      </Modal>
      <table>
        <thead role="rowgroup">
          <tr>
            <th className="tableHead"></th>
            <th className="tableHead"></th>
            <th className="tableHead">Job Title</th>
            <th className="tableHead">Department</th>
            <th className="tableHead">Salary</th>
            <th className="tableHead">Location</th>
            <th className="tableHead">Link to learn more</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map((job, index) => (
            <UsaJobsResultsItem key={index} job={job} selectJob={selectJob} />
          ))}
        </tbody>
      </table>
      <button onClick={returnToSearch}>Back to search</button>
    </div>
  );
}
