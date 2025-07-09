"use client";

import { getUrl } from "aws-amplify/storage";
import { remove } from "aws-amplify/storage";

export async function getFileUrl({ path }: { path: string }) {
  try {
    const { url } = await getUrl({
      path,
      options: {
        bucket: "govRezUserData",
      },
    });
    return url;
  } catch (error) {
    console.error("Error getting file URL:", error);
    return null;
  }
}

export async function deleteFile({ path }: { path: string }) {
  try {
    await remove({
      path,
      // Alternatively, path: ({identityId}) => `album/{identityId}/1.jpg`
      // bucket: 'assignedNameInAmplifyBackend', // Specify a target bucket using name assigned in Amplify Backend
    });
  } catch (error) {
    console.error("Error ", error);
  }
}
