import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      // Basic fields that match Cognito
      email: a.string().required(),
      givenName: a.string(),
      familyName: a.string(),

      // Custom fields for your app
      academicLevel: a.string(),
      birthdate: a.string(),
      citizen: a.boolean(),
      currentAgency: a.string(),
      disabled: a.boolean(),
      fedEmploymentStatus: a.string(),
      gender: a.string(),
      militarySpouse: a.boolean(),
      veteran: a.boolean(),

      // System fields
      cognitoUserId: a.string(),
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),

      // Relationships
      applications: a.hasMany("Application", "userId"),
      awards: a.hasMany("Award", "userId"),
      educations: a.hasMany("Education", "userId"),
      pastJobs: a.hasMany("PastJob", "userId"),
      qualifications: a.hasMany("Qualification", "userId"),
      resumes: a.hasMany("Resume", "userId"),
      specializedExperiences: a.hasMany("SpecializedExperience", "userId"),
      userRoles: a.hasMany("UserRole", "userId"),
      userPermission: a.hasMany("UserPermission", "userId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Application: a
    .model({
      awards: a.hasMany("AwardApplication", "applicationId"),
      completedSteps: a.string().array(),
      educations: a.hasMany("EducationApplication", "applicationId"),
      id: a.id().required(),
      jobId: a.id().required(),
      job: a.belongsTo("Job", "jobId"),
      resumes: a.hasMany("ResumeApplication", "applicationId"),
      specializedExperiences: a.hasMany(
        "SpecializedExperienceApplication",
        "applicationId"
      ),
      status: a.string().default("draft"),
      userId: a.id().required(),
      user: a.belongsTo("User", "userId"),
      pastJobs: a.hasMany("PastJobApplication", "applicationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Award: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      date: a.string().required(),
      userId: a.id().required(),
      user: a.belongsTo("User", "userId"),
      applications: a.hasMany("AwardApplication", "awardId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

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
      user: a.belongsTo("User", "userId"),
      applications: a.hasMany("EducationApplication", "educationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

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
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),
  Permission: a
    .model({
      id: a.id().required(),
      name: a.string().required(), // "user:create", "application:approve"
      resource: a.string().required(), // "user", "application", "job"
      action: a.string().required(), // "create", "read", "update", "delete", "approve"
      description: a.string(),
      isActive: a.boolean().default(true),
      users: a.hasMany("UserPermission", "permissionId"), // Users assigned this role
    })
    .authorization((allow) => [allow.authenticated().to(["read"])]),
  Resume: a
    .model({
      id: a.id().required(),
      fileName: a.string().required(),
      userId: a.id(),
      user: a.belongsTo("User", "userId"),
      applications: a.hasMany("ResumeApplication", "resumeId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Role: a
    .model({
      id: a.id().required(),
      name: a.string().required(), // "admin", "recruiter", "hr_manager"
      displayName: a.string().required(), // "Administrator", "Recruiter", "HR Manager"
      description: a.string(),
      permissions: a.string().array().required(), // List of permissions this role grants
      isActive: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      users: a.hasMany("UserRole", "roleId"), // Users assigned this role
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),
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
      user: a.belongsTo("User", "userId"),
      applications: a.hasMany(
        "SpecializedExperienceApplication",
        "specializedExperienceId"
      ),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Topic: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      keywords: a.string().array().required(),
      description: a.string(),
      evidence: a.string(),
      jobId: a.id().required(),
      job: a.belongsTo("Job", "jobId"),
      qualifications: a.hasMany("Qualification", "topicId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

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
      user: a.belongsTo("User", "userId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Qualification: a
    .model({
      id: a.id().required(),
      title: a.string().required(),
      description: a.string().required(),
      paragraph: a.string(),
      pastJobs: a.hasMany("PastJobQualification", "qualificationId"),
      question: a.string(),
      topicId: a.id().required(),
      topic: a.belongsTo("Topic", "topicId"),
      userConfirmed: a.boolean().required(),
      userId: a.id().required(),
      user: a.belongsTo("User", "userId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  // Join tables
  AwardApplication: a
    .model({
      id: a.id().required(),
      awardId: a.id().required(),
      applicationId: a.id().required(),
      award: a.belongsTo("Award", "awardId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  EducationApplication: a
    .model({
      id: a.id().required(),
      educationId: a.id().required(),
      applicationId: a.id().required(),
      education: a.belongsTo("Education", "educationId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  ResumeApplication: a
    .model({
      id: a.id().required(),
      resumeId: a.id().required(),
      applicationId: a.id().required(),
      resume: a.belongsTo("Resume", "resumeId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  SpecializedExperienceApplication: a
    .model({
      id: a.id().required(),
      specializedExperienceId: a.id().required(),
      applicationId: a.id().required(),
      specializedExperience: a.belongsTo(
        "SpecializedExperience",
        "specializedExperienceId"
      ),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  PastJobApplication: a
    .model({
      id: a.id().required(),
      pastJobId: a.id().required(),
      applicationId: a.id().required(),
      pastJob: a.belongsTo("PastJob", "pastJobId"),
      application: a.belongsTo("Application", "applicationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  PastJobQualification: a
    .model({
      id: a.id().required(),
      pastJobId: a.id().required(),
      qualificationId: a.id().required(),
      pastJob: a.belongsTo("PastJob", "pastJobId"),
      qualification: a.belongsTo("Qualification", "qualificationId"),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),
  // Add this new model:
  UserPermission: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      permissionId: a.id().required(),
      user: a.belongsTo("User", "userId"),
      permission: a.belongsTo("Permission", "permissionId"),
      assignedAt: a.datetime(),
      assignedBy: a.string(), // Who assigned this role
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  // Add this new model:
  UserRole: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      roleId: a.id().required(),
      user: a.belongsTo("User", "userId"),
      role: a.belongsTo("Role", "roleId"),
      assignedAt: a.datetime(),
      assignedBy: a.string(), // Who assigned this role
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    // Keep API key mode removed to avoid circular dependencies
  },
});
