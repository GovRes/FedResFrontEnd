import { generateClient } from "aws-amplify/api";
import { Uploader } from "@/app/components/forms/Uploader";
import type { Schema } from "../../../../amplify/data/resource"; // Path to your backend resource definition

const client = generateClient<Schema>();

export default function ResumeUploader({
  setRefresh,
  setShowUploader,
}: {
  setRefresh: Function;
  setShowUploader: Function;
}) {
  async function onSubmitResume({ fileName }: { fileName: string }) {
    const { errors, data: newResume } = await client.models.Resume.create(
      {
        fileName,
      },
      {
        authMode: "userPool",
      }
    );
    if (errors) {
      console.error(errors);
      return;
    }
    if (newResume) {
      setRefresh(true);
      setShowUploader(false);
    }
  }
  return (
    <div>
      <div>
        <p>Please upload your resume. It needs to be in PDF format.</p>
      </div>
      <Uploader onSuccess={onSubmitResume} />
    </div>
  );
}
