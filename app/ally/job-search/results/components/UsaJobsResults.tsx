"use client";
import React, { useState } from "react";
import UsaJobsResultsItem from "./UsaJobsResultsItem";
import styles from "../../../ally.module.css";
import Modal from "@/app/components/modal/Modal";
import { formatJobDescription } from "@/app/utils/usaJobsSearch";
import indefiniteArticle from "@/app/utils/indefiniteArticles";
import { createAndSaveApplication } from "@/app/crud/application";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useApplication } from "@/app/providers/applicationContext";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import { createOrGetJob } from "@/app/crud/job";
import { useRouter } from "next/navigation";
import { useLoading } from "@/app/providers/loadingContext";

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
}: {
  searchResults: Result[];
}) {
  const { setJob, setApplicationId, completeStep } = useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  const { setIsLoading } = useLoading();
  const { user } = useAuthenticator();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<Result | null>();
  const [isProcessing, setIsProcessing] = useState(false);

  function selectJob({ job }: { job: Result }) {
    setModalOpen(true);
    setCurrentJob(job);
  }

  function returnToSearch() {
    setIsLoading(true);
    router.push("/ally/job-search/");
  }

  async function setJobAndProceed() {
    if (currentJob && !isProcessing) {
      setIsProcessing(true);

      try {
        let formattedJobDescription = formatJobDescription({ job: currentJob });

        // Create or get the job
        let jobRes = await createOrGetJob({
          ...formattedJobDescription,
        });

        // Create the application
        let applicationRes = await createAndSaveApplication({
          jobId: jobRes.id,
          userId: user.userId,
        });

        // Update context state
        setApplicationId(applicationRes.id);
        setJob(jobRes);

        // Complete the step through the context, passing the new applicationId
        await completeStep("usa-jobs", applicationRes.id);

        // Navigate to next step
        await navigateToNextIncompleteStep("usa-jobs");
      } catch (error) {
        console.error("Error setting job and proceeding:", error);
        // You might want to show an error message to the user here
      } finally {
        setIsProcessing(false);
      }
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
            <button onClick={setJobAndProceed} disabled={isProcessing}>
              {isProcessing
                ? "Processing..."
                : `Yes, let's apply to be ${indefiniteArticle({
                    phrase: currentJob.MatchedObjectDescriptor.PositionTitle,
                  })} ${currentJob?.MatchedObjectDescriptor.PositionTitle}!`}
            </button>
            <button onClick={() => setModalOpen(false)} disabled={isProcessing}>
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
