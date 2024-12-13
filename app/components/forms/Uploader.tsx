import React, { useState } from "react";
import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';
import ConfigureAmplifyClientSide from "@/app/ConfigureAmplify";

export const Uploader = () => {
  return (
    <>
<ConfigureAmplifyClientSide />
    <FileUploader
      acceptedFileTypes={['application/pdf']}
      path="resumes/"
      maxFileCount={1}
      isResumable
      />
      </>
  );
};
// function Uploader() {
//   const [file, setFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);

//   const allowedTypes = [
//     // 'image/jpeg',
//     // 'image/png',
//     "application/pdf",
//     // 'video/mp4',
//     // 'video/quicktime',
//     // 'audio/mpeg',
//     // 'audio/wav',
//     // Add more supported types as needed
//   ];

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (files && files.length > 0) {
//       const selectedFile = files[0];
//       if (allowedTypes.includes(selectedFile.type)) {
//         setFile(selectedFile);
//       } else {
//         alert("Invalid file type. Only PDFs are allowed.");
//       }
//     }
//   };

//   const uploadFile = async () => {
//     if (!file) {
//       alert("No file selected.");
//       return;
//     }

//     setUploading(true);
//     if (!process.env.NEXT_PUBLIC_S3_BUCKET_NAME) {
//       alert("S3 bucket name is not defined.");
//       setUploading(false);
//       return;
//     }
//     if (!process.env.NEXT_PUBLIC_REGION) {
//       alert("Region is not defined.");
//       setUploading(false);
//       return;
//     }

//     let s3 = new S3Client({
//       region: process.env.NEXT_PUBLIC_REGION,
//       // credentials: {
//       //   accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
//       //   secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
//       // },
//     });

//     console.log(s3);

//     try {
//       await s3.send(
//         new PutObjectCommand({
//           Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
//           Key: file.name,
//           Body: file,
//         })
//       );
//       setUploading(false);
//       alert("File uploaded successfully.");
//     } catch (caught) {
//       if (
//         caught instanceof S3ServiceException &&
//         caught.name === "EntityTooLarge"
//       ) {
//         console.error(
//           `Error from S3 while uploading object to ${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}. \
//   The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
//   or the multipart upload API (5TB max).`
//         );
//       } else if (caught instanceof S3ServiceException) {
//         console.error(
//           `Error from S3 while uploading object to ${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.  ${caught.name}: ${caught.message}`
//         );
//       } else {
//         throw caught;
//       }
//     }
//   };

//   return (
//     <div className="">
//       <input type="file" required onChange={handleFileChange} />
//       <button onClick={uploadFile}>
//         {uploading ? "Uploading..." : "Upload File"}
//       </button>
//     </div>
//   );
// }

// export default Uploader;
