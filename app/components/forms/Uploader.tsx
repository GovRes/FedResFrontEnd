import React, { useState } from "react";
import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';
import ConfigureAmplifyClientSide from "@/app/ConfigureAmplify";

export const Uploader = ({onSuccess}: {onSuccess: Function}) => {
  return (
    <>
<ConfigureAmplifyClientSide />
    <FileUploader
      acceptedFileTypes={['application/pdf']}
      path={({identityId}) => `resumes/${identityId}/`}
      maxFileCount={1}
      isResumable
      onUploadError={(error, { key }) => {
        console.log(error, key)
 
      }}
      onUploadSuccess={({ key }) => {
          onSuccess({fileName: key})
      }}
      />
      </>
  );
};
