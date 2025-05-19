import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
const schema = a.schema({
    Application: a
    .model({
      awards: a.hasMany("AwardApplication", "applicationId"),
      completedSteps: a.string().array(),
      educations: a.hasMany("EducationApplication", "applicationId"),
      id: a.id().required(),
      jobId: a.id().required(),
      job: a.belongsTo("Job", "jobId"),
      resumes: a.hasMany("ResumeApplication", "applicationId"),
      specializedExperiences: a.hasMany("SpecializedExperienceApplication", "applicationId"),
      status: a.string().default("draft"),
      userId: a.id().required(),
      pastJobs: a.hasMany("PastJobApplication", "applicationId"),
    })
    .authorization((allow) => [allow.owner()]),
    // Define Award model
  Award: a
  .model({
    id: a.id().required(),
    title: a.string().required(),
    date: a.string().required(),
    userId: a.id().required(),
    applications: a.hasMany("AwardApplication", "awardId")
  })
  .authorization((allow) => [allow.owner()]),
   // Define Education model
   Education: a
   .model({
     id: a.id().required(),
     degree: a.string().required(),
     major: a.string().required(),
     school: a.string().required(),
     schoolCity: a.string(),
     schoolState: a.string(),
     date: a.string().required(),
     title: a.string().required(),
     gpa: a.string(),
     userConfirmed: a.boolean(),
     userId: a.id().required(),
     applications: a.hasMany("EducationApplication", "educationId")
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
      topics: a.hasMany("Topic", "jobId"),
      usaJobsId: a.string().required(),
      applications: a.hasMany("Application", "jobId"),
    })
    .authorization((allow) => [allow.authenticated()]),

  // Define Resume model
  Resume: a
    .model({
      id: a.id().required(),
      fileName: a.string().required(),
      userId: a.id(),
      applications: a.hasMany("ResumeApplication", "resumeId"),
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
    typeOfExperience: a.string(),
    userId: a.id().required(),
    applications: a.hasMany("SpecializedExperienceApplication", "specializedExperienceId")
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
    jobId: a.id().required(),
    job: a.belongsTo("Job", "jobId"),
    question: a.string(),
    qualifications: a.hasMany("Qualification", "topicId"),
  })
  .authorization((allow) => [allow.authenticated()]),

  // Define pastJob model
  PastJob: a
    .model({
      applications: a.hasMany("PastJobApplication", "pastJobId"),
      endDate: a.string(),
      gsLevel: a.string(),
      hours: a.string(),
      id: a.id().required(),
      organization: a.string().required(),
      organizationAddress: a.string(),
      qualifications: a.hasMany("PastJobQualification", "pastJobId"),
      responsibilities: a.string(),
      startDate: a.string(),
      supervisorMayContact: a.boolean(),
      supervisorName: a.string(),
      supervisorPhone: a.string(),
      title: a.string().required(),
      type: a.string().required(),
      userId: a.id().required(),
    })
    .authorization((allow) => [allow.owner()]),

    // Define Qualification model
    Qualification: a
  .model({
    id: a.id().required(),
    title: a.string().required(),
    description: a.string().required(),
    paragraph: a.string(),
    userConfirmed: a.boolean().required(),
    topicId: a.id().required(),
    topic: a.belongsTo("Topic", "topicId"),
    userId: a.id().required(),
    pastJobs: a.hasMany("PastJobQualification", "qualificationId"),
  })
  .authorization((allow) => [allow.owner()]),

//join tables
AwardApplication: a
    .model({
      id: a.id().required(),
      awardId: a.id().required(),
      applicationId: a.id().required(),
      award: a.belongsTo("Award", "awardId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    EducationApplication: a
    .model({
      id: a.id().required(),
      educationId: a.id().required(),
      applicationId: a.id().required(),
      education: a.belongsTo("Education", "educationId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [allow.authenticated()]),
    
    ResumeApplication: a
    .model({
      id: a.id().required(),
      resumeId: a.id().required(),
      applicationId: a.id().required(),
      resume: a.belongsTo("Resume", "resumeId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    SpecializedExperienceApplication: a
    .model({
      id: a.id().required(),
      specializedExperienceId: a.id().required(),
      applicationId: a.id().required(),
      specializedExperience: a.belongsTo("SpecializedExperience", "specializedExperienceId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    PastJobApplication: a
    .model({
      id: a.id().required(),
      pastJobId: a.id().required(),
      applicationId: a.id().required(),
      pastJob: a.belongsTo("PastJob", "pastJobId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [allow.authenticated()]),

    PastJobQualification: a
    .model({
      id: a.id().required(),
      pastJobId: a.id().required(),
      qualificationId: a.id().required(),
      pastJob: a.belongsTo("PastJob", "pastJobId"),
      qualification: a.belongsTo("Qualification", "qualificationId"),
    })
    .authorization((allow) => [allow.authenticated()]),
});
// 
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
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
