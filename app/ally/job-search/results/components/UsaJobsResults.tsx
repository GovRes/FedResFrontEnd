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
import { navigateToNextIncompleteStep } from "@/app/utils/nextStepNavigation";
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
  const { steps, setJob, setApplicationId, completeStep } = useApplication();
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
        const wasJustCreated: boolean =
          new Date().getTime() - new Date(jobRes.createdAt).getTime() < 1000;
        if (wasJustCreated || !jobRes.questionnaire) {
          setIsLoading(true);
          let usaJobsId = jobRes.usaJobsId;
          console.log(84, usaJobsId);
          try {
            const response = await fetch("/api/ai-questionnaire-extractor", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jobId: usaJobsId, // Only send jobId, server will fetch HTML
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("AI Questionnaire Extractor Result:", result);
            if (result.found) {
              try {
                const response = await fetch(`${result.questionnaireUrl}`, {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept:
                      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate, br",
                    DNT: "1",
                    Connection: "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                  },
                });
                //tk add this to the job object in the questionnaire attribute.
                console.log(119, response);
              } catch (error) {
                console.error("Error pulling questionnaire:", error);
              }
            }
          } catch (error) {
            console.error("Error getting questionnaire URL:", error);
            return {
              found: false,
              questionnaireUrl: null,
              reasoning: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
              usaJobsId,
            };
          }
        }
        // Create the application
        let applicationRes = await createAndSaveApplication({
          jobId: jobRes.id,
          userId: user.userId,
        });

        // Update context state
        setApplicationId(applicationRes.id);
        setJob(jobRes);
        // Navigate to next step
        navigateToNextIncompleteStep({
          steps,
          router,
          currentStepId: "usa-jobs",
          applicationId: applicationRes.id,
          completeStep,
        });
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
