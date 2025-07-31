import {
  GenericFieldWithLabel,
  SubmitButton,
} from "@/app/components/forms/Inputs";
import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import processUSAJob from "@/app/utils/processUSAJob";
import { formatJobDescriptionFromTextFetch } from "@/app/utils/usaJobsFormatting";
import { useApplication } from "@/app/providers/applicationContext";
import { navigateToNextIncompleteStep } from "@/app/utils/nextStepNavigation";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useLoading } from "@/app/providers/loadingContext";
import { useRouter } from "next/navigation";
import JobNotFound from "./JobNotFound";
import QuestionnaireNotFound from "./QuestionnaireNotFound";
import createApplication from "@/app/utils/createApplication";
import { usaJobObjectExtractor } from "@/app/components/aiProcessing/usaJobObjectExtractor";
const stringFieldSchema = z.object({
  value: z.string(),
});

export default function PastJobUrl() {
  const { applicationId, job, steps, setJob, setApplicationId, completeStep } =
    useApplication();
  const { setIsLoading } = useLoading();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const [questionnaireFound, setQuestionnaireFound] = useState(false);
  const [searchSent, setSearchSent] = useState(false);
  const [jobResult, setJobResult] = useState<any>(null);
  const router = useRouter();

  const onSubmit = async (data: { value: string }): Promise<void> => {
    setSearchSent(true);
    setLoading(true);

    try {
      const url = new URL(data.value);
      const matchResult = url.pathname.match(/\/job\/(\d+)/);
      const jobId = matchResult ? matchResult[1] : null;

      if (jobId) {
        console.log("Job ID extracted from URL:", jobId);
        const jobRes = await fetch(`/api/jobs/${jobId}`).then((res) =>
          res.json()
        );
        console.log("Job data fetched:", jobRes);

        const formattedJobDescription = await formatJobDescriptionFromTextFetch(
          {
            job: jobRes.data[0],
          }
        );
        console.log("Formatted job description:", formattedJobDescription);

        const jobResult = await processUSAJob(formattedJobDescription);
        console.log("Job processing result:", jobResult);

        setJobResult(jobResult);
        setQuestionnaireFound(jobResult?.questionnaireFound || false);
        setJob(formattedJobDescription);

        // If questionnaire found, automatically create application and navigate
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
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    setLoading(false);
    console.error("Form validation errors:", errors);
  };

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm({
    defaultValues: {
      value: "",
    },
  });

  const resetSearch = () => {
    setSearchSent(false);
    setQuestionnaireFound(false);
    setJobResult(null);
  };

  const proceedWithoutQuestionnaire = async () => {
    if (jobResult?.jobId) {
      const newApplicationId = await createApplication({
        completeStep,
        jobId: jobResult.jobId,
        userId: user.userId,
        setLoading: setLoading,
        setApplicationId,
      });
      if (newApplicationId) {
        console.log("Navigating to next step");
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
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!searchSent) {
    return (
      <div>
        <div>
          Paste the URL of a job from USAJobs.gov that you would like to apply
          for.
        </div>
        <form
          onSubmit={(e) => {
            console.log("Form onSubmit triggered directly!");
            handleSubmit(onSubmit, onError)(e);
          }}
        >
          <GenericFieldWithLabel
            errors={errors}
            label="Paste the full job URL here"
            name="value"
            register={register}
            schema={stringFieldSchema}
          />
          <SubmitButton>Submit</SubmitButton>
        </form>
      </div>
    );
  }

  if (searchSent && !questionnaireFound) {
    return (
      <div>
        <div>
          We could not find a questionnaire for this job. Please try another job
          URL. We will eventually have an interface that will allow you to paste
          the questionnaire. In the meantime, you can either move forward based
          only on the job information we were able to retrieve, or return to
          search.
        </div>
        <button onClick={resetSearch}>Back to paste a different job URL</button>
        <button onClick={proceedWithoutQuestionnaire}>
          Go forward with less information
        </button>
      </div>
    );
  }

  if (searchSent && !jobResult && !loading) {
    return (
      <JobNotFound
        setJobResult={setJobResult}
        setQuestionnaireFound={setQuestionnaireFound}
        setSearchSent={setSearchSent}
      />
    );
  }

  if (searchSent && jobResult && !loading && !questionnaireFound) {
    return (
      <QuestionnaireNotFound
        jobResult={jobResult}
        userId={user.userId}
        setJobResult={setJobResult}
        setLoading={setLoading}
        setQuestionnaireFound={setQuestionnaireFound}
        setSearchSent={setSearchSent}
      />
    );
  } else if (searchSent && jobResult && questionnaireFound && applicationId) {
    return (
      <div>
        <div>
          We found a questionnaire for this job! You can now proceed to fill out
          the application.
        </div>
      </div>
    );
  }
}
