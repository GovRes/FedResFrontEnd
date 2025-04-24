import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { Topic } from 'aws-cdk-lib/aws-sns';
/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
    UserResume: a
    .model({
      awards: a.hasMany("AwardUserResume", "userResumeId"),
      educations: a.hasMany("EducationUserResume", "userResumeId"),
      id: a.id().required(),
      jobId: a.id().required(),
      job: a.hasOne("Job", "id").required(),
      resumes: a.hasMany("ResumeUserResume", "userResumeId"),
      specializedExperiences: a.hasMany("SpecializedExperienceUserResume", "userResumeId"),
      userJobs: a.hasMany("UserJobUserResume", "userResumeId"),
      volunteers: a.hasMany("VolunteerUserResume", "userResumeId"),
    })
    .authorization((allow) => [allow.owner()]),
    // Define Award model
  Award: a
  .model({
    id: a.id().required(),
    title: a.string().required(),
    date: a.string().required(),
    userResumes: a.hasMany("AwardUserResume", "awardId")
  })
  .authorization((allow) => [allow.owner()]),
   // Define Education model
   Education: a
   .model({
     id: a.id().required(),
     degree: a.string().required(),
     major: a.string().required(),
     school: a.string().required(),
     date: a.string().required(),
     title: a.string().required(),
     gpa: a.string(),
     userConfirmed: a.boolean(),
     userResumes: a.hasMany("EducationUserResume", "educationId")
   })
   .authorization((allow) => [allow.owner()]),
  Job: a
    .model({
      id: a.id().required(),
      agencyDescription: a.string().required(),
      department: a.string().required(),
      duties: a.string().required(),
      evaluationCriteria: a.string().required(),
      qualificationsSummary: a.string().required(),
      requiredDocuments: a.string().required(),
      title: a.string().required(),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Define Resume model
  Resume: a
    .model({
      id: a.id().required(),
      fileName: a.string().required(),
      userResumes: a.hasMany("ResumeUserResume", "resumeId"),
    })
    .authorization((allow) => [allow.owner()]),
     // Define SpecializedExperience model
  SpecializedExperience: a
  .model({
    id: a.id().required(),
    title: a.string().required(),
    description: a.string().required(),
    userConfirmed: a.boolean(),
    paragraph: a.string(),
    initialMessage: a.string().required(),
    userResumes: a.hasMany("SpecializedExperienceUserResume", "specializedExperienceId")
  })
  .authorization((allow) => [allow.owner()]),
    // Define Topic model
  Topic: a
  .model({
    id: a.id().required(),
    title: a.string().required(),
    keywords: a.string().array().required(),
    description: a.string(),
    evidence: a.string(),
    question: a.string(),
    userJobQualifications: a.hasMany("UserJobQualification", "topicId"),
  })
  .authorization((allow) => [allow.authenticated()]),

  // Define UserJob model
  UserJob: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      organization: a.string().required(),
      startDate: a.string(),
      endDate: a.string(),
      hours: a.string(),
      gsLevel: a.string(),
      responsibilities: a.string(),
      userJobQualifications: a.hasMany("UserJobUserJobQualification", "userJobId"),
      userResumes: a.hasMany("UserJobUserResume", "userJobId")
    })
    .authorization((allow) => [allow.owner()]),

    // Define UserJobQualification model
  UserJobQualification: a
  .model({
    id: a.id().required(),
    title: a.string().required(),
    description: a.string().required(),
    paragraph: a.string(),
    userConfirmed: a.boolean().required(),
    topic: a.hasOne("Topic", "id").required(),
    userJobs: a.hasMany("UserJobUserJobQualification", "userJobQualificationId"),
    volunteers: a.hasMany("UserJobQualificationVolunteer", "userJobQualificationId"),
  })
  .authorization((allow) => [allow.owner()]),

  // Define Volunteer model (similar structure to UserJob)
  Volunteer: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      organization: a.string().required(),
      startDate: a.string(),
      endDate: a.string(),
      hours: a.string(),
      gsLevel: a.string(),
      responsibilities: a.string(),
      userJobQualifications:a.hasMany("UserJobQualificationVolunteer", "volunteerId"),
      userResumes: a.hasMany("VolunteerUserResume", "volunteerId")
    })
    .authorization((allow) => [allow.owner()]),
//join tables
AwardUserResume: a
    .model({
      id: a.id().required(),
      awardId: a.id().required(),
      userResumeId: a.id().required(),
      award: a.belongsTo("Award", "awardId"),
      userResume: a.belongsTo("UserResume", "userResumeId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    EducationUserResume: a
    .model({
      id: a.id().required(),
      educationId: a.id().required(),
      userResumeId: a.id().required(),
      education: a.belongsTo("Education", "educationId"),
      userResume: a.belongsTo("UserResume", "userResumeId"),
    })
    .authorization((allow) => [allow.authenticated()]),
    
    ResumeUserResume: a
    .model({
      id: a.id().required(),
      resumeId: a.id().required(),
      userResumeId: a.id().required(),
      resume: a.belongsTo("Resume", "resumeId"),
      userResume: a.belongsTo("UserResume", "userResumeId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    SpecializedExperienceUserResume: a
    .model({
      id: a.id().required(),
      specializedExperienceId: a.id().required(),
      userResumeId: a.id().required(),
      specializedExperience: a.belongsTo("SpecializedExperience", "specializedExperienceId"),
      userResume: a.belongsTo("UserResume", "userResumeId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    UserJobUserResume: a
    .model({
      id: a.id().required(),
      userJobId: a.id().required(),
      userResumeId: a.id().required(),
      userJob: a.belongsTo("UserJob", "userJobId"),
      userResume: a.belongsTo("UserResume", "userResumeId"),
    })
    .authorization((allow) => [allow.authenticated()]),
    
    VolunteerUserResume: a
    .model({
      id: a.id().required(),
      volunteerId: a.id().required(),
      userResumeId: a.id().required(),
      volunteer: a.belongsTo("Volunteer", "volunteerId"),
      userResume: a.belongsTo("UserResume", "userResumeId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    UserJobUserJobQualification: a
    .model({
      id: a.id().required(),
      userJobId: a.id().required(),
      userJobQualificationId: a.id().required(),
      userJob: a.belongsTo("UserJob", "userJobId"),
      userJobQualification: a.belongsTo("UserJobQualification", "userJobQualificationId"),
    })
    .authorization((allow) => [allow.authenticated()]),
    UserJobQualificationVolunteer: a
    .model({
      id: a.id().required(),
      userJobQualificationId: a.id().required(),
      volunteerId: a.id().required(),
      userJobQualification: a.belongsTo("UserJobQualification", "userJobQualificationId"),
      volunteer: a.belongsTo("Volunteer", "volunteerId"),
    })
    .authorization((allow) => [allow.authenticated()]),
});
// 
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});


/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
