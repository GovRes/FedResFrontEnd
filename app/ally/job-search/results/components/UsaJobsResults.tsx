"use client";
import React, { useState } from "react";
import UsaJobsResultsItem from "./UsaJobsResultsItem";
import styles from "../../../ally.module.css";
import Modal from "@/app/components/modal/Modal";
import { formatJobDescription } from "@/lib/utils/usaJobsSearch";
import indefiniteArticle from "@/lib/utils/indefiniteArticles";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useApplication } from "@/app/providers/applicationContext";
import { navigateToNextIncompleteStep } from "@/lib/utils/nextStepNavigation";
import { useRouter } from "next/navigation";
import processUSAJob from "@/lib/utils/processUSAJob";
import createApplication from "@/lib/utils/createApplication";
import QuestionnaireNotFound from "./QuestionnaireNotFound";
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
  const { steps, setApplicationId, completeStep } = useApplication();
  const { user } = useAuthenticator();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<Result | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [questionnaireFound, setQuestionnaireFound] = useState<boolean>(false);
  const [jobResult, setJobResult] = useState<any>(null);
  function selectJob({ job }: { job: Result }) {
    setModalOpen(true);
    setCurrentJob(job);
  }
  function returnToSearch() {
    router.push("/ally/job-search/");
  }
  async function setJobAndProceed() {
    if (currentJob) {
      try {
        let formattedJobDescription = formatJobDescription({ job: currentJob });

        // Create or get the job
        const jobResult = await processUSAJob(formattedJobDescription);
        console.log("Job processing result:", jobResult);
        if (jobResult) {
          setJobResult(jobResult);
        }
        if (!jobResult?.questionnaireFound) {
          setQuestionnaireFound(false);
        }
        if (jobResult?.questionnaireFound && jobResult?.jobId) {
          console.log("Creating application with questionnaire");
          const newApplicationId = await createApplication({
            completeStep,
            jobId: jobResult.jobId,
            userId: user.userId,
            setLoading: setLoading,
            setApplicationId,
          });

          if (newApplicationId) {
            console.log("Navigating to next step");
            // Use a small delay to ensure context updates have propagated
            setTimeout(() => {
              navigateToNextIncompleteStep({
                steps,
                router,
                currentStepId: "usa-jobs",
                applicationId: newApplicationId, // Use the new ID directly
                completeStep,
              });
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error getting questionnaire URL:", error);
        return {
          found: false,
          questionnaireUrl: null,
          reasoning: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }
  }

  if (!loading && jobResult && !questionnaireFound) {
    return (
      <QuestionnaireNotFound
        jobId={jobResult.jobId}
        returnToSearch={returnToSearch}
        userId={user.userId}
        setLoading={setLoading}
      />
    );
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
