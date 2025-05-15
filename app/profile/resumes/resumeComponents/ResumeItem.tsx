"use client";

import { ResumeType } from "@/app/utils/responseSchemas";
import styles from "./resumeStyles.module.css";
import { GrDownload, GrTrash } from "react-icons/gr";
import { getFileUrl, deleteFile } from "@/app/utils/client-utils";
import { useEffect, useState } from "react";

export default function ResumeItem({
  resume,
  setRefresh,
}: {
  resume: ResumeType;
  setRefresh: Function;
}) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const fileName = resume.path.split("/").pop();
  useEffect(() => {
    getFileUrl({ path: resume.path }).then((url) => {
      if (url) setFileUrl(url.toString());
    });
  }, [resume.path]);

  const deleteItem = async (): Promise<void> => {
    const response = await deleteFile({ path: resume.path });
    setRefresh(true);
  };

  return (
    <tr>
      <td className="tableData" role="cell">
        {new Date(resume.lastModified).toLocaleDateString()}
      </td>
      <td className="tableData" role="cell">
        {fileName}
      </td>
      <td className="tableData" role="cell">
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noreferrer">
            <GrDownload />
          </a>
        )}
      </td>
      <td className="tableData" role="cell">
        <span onClick={deleteItem}>
          <GrTrash />
        </span>
      </td>
    </tr>
  );
}
