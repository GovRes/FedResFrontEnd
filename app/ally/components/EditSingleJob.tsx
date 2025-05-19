import DetailedListEditor from "../../components/ally/sharedComponents/DetailedListEditor/DetailedListEditor";
import {
  pastJobsAssistantName,
  pastJobsAssistantInstructions,
} from "@/app/prompts/pastJobsWriterPrompt";
import { QualificationType, PastJobType } from "@/app/utils/responseSchemas";
import { useApplication } from "@/app/providers/applicationContext";

export default function EditSingleJob({
  navigateToNextUnconfirmedJob,
  pastJob,
  savePastJob,
}: {
  navigateToNextUnconfirmedJob: (job: PastJobType) => void;
  pastJob: PastJobType;
  savePastJob: (PastJob: PastJobType) => void;
}) {
  const { job } = useApplication();

  function saveQualification(updatedQualifications: QualificationType[]) {
    console.log(21, updatedQualifications);
    try {
      if (
        updatedQualifications.length > 0 &&
        "topic" in updatedQualifications[0]
      ) {
        let tempPastJob = {
          ...pastJob,
          qualifications: updatedQualifications.map((qual) => ({
            ...qual,
            userConfirmed: true, // Force this to be true
          })),
        };
        console.log(
          "About to save job with confirmed qualifications:",
          tempPastJob
        );
        savePastJob(tempPastJob);
      } else {
        console.error("Received incompatible qualification type");
      }
    } catch (error) {
      console.error("Error in saveQualification:", error);
    }
  }
  // Otherwise display the qualifications
  return (
    <DetailedListEditor
      assistantInstructions={pastJobsAssistantInstructions}
      assistantName={pastJobsAssistantName}
      heading={`${pastJob?.title} - Applicable Work Experience`}
      items={pastJob.qualifications}
      jobString={`${job?.title} at the ${job?.department}`}
      navigateToNextUnconfirmedJob={navigateToNextUnconfirmedJob}
      setFunction={saveQualification}
      setNext={navigateToNextUnconfirmedJob}
      sidebarTitleText="Job Experience"
    />
  );
}
