"use client";
import React, { useContext, useState } from "react";
import UsaJobsResultsItem from "./UsaJobsResultsItem";
import styles from "../../../ally.module.css";
import { createModelRecord } from "@/app/crud/genericCreate";
import Modal from "@/app/components/modal/Modal";
import { AllyContext } from "@/app/providers";
import { formatJobDescription } from "@/app/utils/usaJobsSearch";
import indefiniteArticle from "@/app/utils/indefiniteArticles";
import { createAndSaveApplication } from "@/app/crud/application";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { completeSteps } from "@/app/utils/stepUpdater";
import { useApplication } from "@/app/providers/applicationContext";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import { createOrGetJob } from "@/app/crud/job";
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
  const allyContext = useContext(AllyContext);
  if (!allyContext) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { steps, setJob, setSteps, setApplicationId } = useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
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
      let formattedJobDescription = formatJobDescription({ job: currentJob });
      //not using generic create because we want to check if there is already an entry for this job
      let jobRes = await createOrGetJob({
        ...formattedJobDescription,
      });
      let applicationRes = await createAndSaveApplication({
        jobId: jobRes.id,
        userId: user.userId,
      });
      setApplicationId(applicationRes.id);
      const updatedSteps = await completeSteps({
        steps,
        stepId: "usa-jobs",
        applicationId: applicationRes.id,
      });
      setSteps(updatedSteps);
      setJob(jobRes);

      // Only navigate after all steps are completed
      await navigateToNextIncompleteStep("usa-jobs");
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
