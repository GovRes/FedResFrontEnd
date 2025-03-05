"use client";

import { ResumeType } from "@/app/utils/responseSchemas";
import styles from "../ally.module.css";
import { GrDownload, GrTrash } from "react-icons/gr";
import { getFileUrl, deleteFile } from "@/app/utils/client-utils";
import { useEffect, useState } from "react";
import { Checkbox } from "../../forms/Inputs";

export default function ResumeItem({
  resume,
  selectedResumes,
  setSelectedResumes,
}: {
  resume: ResumeType;
  selectedResumes: ResumeType[];
  setRefresh: Function;
  setSelectedResumes: Function;
}) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileName = resume.path.split("/").pop();
  function updateSelectedResumes() {
    setSelectedResumes((selectedResumes: ResumeType[]) => {
      if (selectedResumes.includes(resume)) {
        return selectedResumes.filter(
          (selectedResume) => selectedResume !== resume
        );
      } else {
        return [...selectedResumes, resume];
      }
    });
  }
  useEffect(() => {
    getFileUrl({ path: resume.path }).then((url) => {
      if (url) setFileUrl(url.toString());
    });
  }, [resume.path]);

  return (
    <tr>
      <td className="tableData" role="cell">
        <Checkbox name="selected" handleChange={updateSelectedResumes} />
      </td>
      <td className="tableData" role="cell">
        {fileName}
      </td>
      <td className="tableData" role="cell">
        {new Date(resume.lastModified).toLocaleDateString()}
      </td>
    </tr>
  );
}
