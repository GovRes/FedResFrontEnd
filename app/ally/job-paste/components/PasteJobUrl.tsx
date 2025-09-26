"use client";
import {
  GenericFieldWithLabel,
  SubmitButton,
} from "@/app/components/forms/Inputs";
import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import processUSAJob from "@/lib/utils/processUSAJob";
import { useApplication } from "@/app/providers/applicationContext";
import { useAuthenticator } from "@aws-amplify/ui-react";
import JobNotFound from "./JobNotFound";
import QuestionnaireNotFound from "./QuestionnaireNotFound";
import { usaJobObjectExtractor } from "@/lib/aiProcessing/usaJobObjectExtractor";
import { JobType } from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import createApplicationAndNavigate from "../../components/createApplicationAndNav";
import { getJobByUsaJobsId } from "@/lib/crud/job";
import { useRouter } from "next/navigation";

const stringFieldSchema = z.object({
  value: z.string(),
});

export default function PastJobUrl() {
  const { completeStep, steps, setApplicationId, setJob } = useApplication();
  const router = useRouter();
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(
    "Processing job URL, please wait..."
  );
  const [questionnaireFound, setQuestionnaireFound] = useState(false);
  const [searchSent, setSearchSent] = useState(false);
  const [jobResult, setJobResult] = useState<any>(null);
  const [isCreatingApplication, setIsCreatingApplication] = useState(false);

  const onSubmit = async (data: { value: string }): Promise<void> => {
    setSearchSent(true);
    setLoading(true);

    try {
      const url = new URL(data.value);
      const matchResult = url.pathname.match(/\/job\/(\d+)/);
      const jobId = matchResult ? matchResult[1] : null;

      if (jobId) {
        setLoadingText("Fetching job...");
        const { data, statusCode } = await getJobByUsaJobsId(jobId);
        if (statusCode === 200 && data) {
          if (data.questionnaire) {
            setQuestionnaireFound(true);
            setIsCreatingApplication(true);
          }
          createApplicationAndNavigate({
            jobId: data.id,
            userId: user.userId,
            setLoading,
            steps,
            setApplicationId,
            completeStep,
            router,
          });
        } else {
          const jobRes = await fetch(`/api/jobs/${jobId}`).then((res) =>
            res.json()
          );
          console.log("Job data fetched:", jobRes);
          setLoadingText("Reading job posting...");
          const formattedJobDescription = (await usaJobObjectExtractor({
            jobObject: jobRes.data[0],
          })) as JobType;
          setLoadingText("Processing job data...");
          const jobResult = await processUSAJob(
            formattedJobDescription,
            setLoadingText
          );
          console.log("Job processing result:", jobResult);

          setJobResult(jobResult);
          setQuestionnaireFound(jobResult?.questionnaireFound || false);
          setJob(formattedJobDescription);

          // If questionnaire found, automatically create application and navigate
          if (jobResult?.questionnaireFound && jobResult?.jobId) {
            console.log("Creating application with questionnaire");
            setLoadingText("Starting your application....");
            setIsCreatingApplication(true);
            createApplicationAndNavigate({
              jobId: jobResult.jobId,
              userId: user.userId,
              setLoading,
              steps,
              setApplicationId,
              completeStep,
              router,
            });
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
    setIsCreatingApplication(false);
  };

  // Show loader if loading OR if creating application
  if (loading || isCreatingApplication) {
    return <Loader text={loadingText} />;
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

  if (searchSent && !questionnaireFound && jobResult) {
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
  }

  if (searchSent && !jobResult && !loading) {
    return <JobNotFound resetSearch={resetSearch} />;
  }
  return null;
}
