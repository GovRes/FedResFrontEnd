/**
 * Shared GraphQL fragments for consistent field selection across all CRUD operations
 * Import and use these fragments in your GraphQL queries to maintain consistency
 * and reduce duplication.
 */

// Base entity fragments
export const FRAGMENTS = {
  // User fields
  UserFields: `
    fragment UserFields on User {
      id
      email
      givenName
      familyName
      academicLevel
      birthdate
      citizen
      currentAgency
      disabled
      fedEmploymentStatus
      gender
      militarySpouse
      veteran
      cognitoUserId
      isActive
      createdAt
      updatedAt
    }
  `,

  UserBasicFields: `
    fragment UserBasicFields on User {
      id
      email
      givenName
      familyName
    }
  `,

  // Job fields
  JobFields: `
    fragment JobFields on Job {
      id
      title
      department
      usaJobsId
    }
  `,

  JobDetailedFields: `
    fragment JobDetailedFields on Job {
      id
      title
      department
      usaJobsId
      agencyDescription
      duties
      evaluationCriteria
      qualificationsSummary
      questionnaire
      requiredDocuments
    }
  `,

  // Topic fields
  TopicFields: `
    fragment TopicFields on Topic {
      description
      id
      importance
      jobId
      keywords
      title
    }
  `,

  TopicWithJobFields: `
    fragment TopicWithJobFields on Topic {
      ...TopicFields
      job {
        ...JobFields
      }
    }
  `,

  // Application fields
  ApplicationFields: `
    fragment ApplicationFields on Application {
      id
      status
      completedSteps
      jobId
      userId
      createdAt
      updatedAt
    }
  `,

  ApplicationWithJobFields: `
    fragment ApplicationWithJobFields on Application {
      ...ApplicationFields
      job {
        ...JobFields
      }
    }
  `,

  ApplicationWithJobDetailedFields: `
    fragment ApplicationWithJobDetailedFields on Application {
      ...ApplicationFields
      job {
        ...JobDetailedFields
      }
      user {
        ...UserBasicFields
      }
    }
  `,

  // Award fields
  AwardFields: `
    fragment AwardFields on Award {
      id
      title
      date
      userId
      createdAt
      updatedAt
    }
  `,

  // Education fields
  EducationFields: `
    fragment EducationFields on Education {
      id
      degree
      major
      minor
      school
      schoolCity
      schoolState
      date
      type
      gpa
      userId
      createdAt
      updatedAt
    }
  `,

  // Resume fields
  ResumeFields: `
    fragment ResumeFields on Resume {
      id
      fileName
      userId
      createdAt
      updatedAt
    }
  `,

  // Qualification fields
  QualificationFields: `
  fragment QualificationFields on Qualification {
    id
    title
    description
    paragraph
    question
    userConfirmed
    conversationThreadId
    topicId
    userId
    pastJobId
    createdAt
    updatedAt
  }
`,

  QualificationWithTopicFields: `
  fragment QualificationWithTopicFields on Qualification {
    ...QualificationFields
    applications {
      items {
        applicationId
      }
    }
    topic {
      ...TopicWithJobFields
    }
  }
`,

  QualificationWithPastJobFields: `
    fragment QualificationWithPastJobFields on Qualification {
      ...QualificationFields
      pastJob {
        id
        title
        organization
        startDate
        endDate
      }
      topic {
        ...TopicFields
      }
    }
  `,

  QualificationWithApplicationsFields: `
    fragment QualificationWithApplicationsFields on Qualification {
      ...QualificationWithPastJobFields
      applications {
        items {
          id
          qualificationId
          applicationId
          application {
            ...ApplicationWithJobDetailedFields
          }
        }
      }
    }
  `,

  // PastJob fields
  PastJobFields: `
    fragment PastJobFields on PastJob {
      id
      title
      organization
      organizationAddress
      startDate
      endDate
      hours
      gsLevel
      responsibilities
      supervisorName
      supervisorPhone
      supervisorMayContact
      type
      userId
      createdAt
      updatedAt
    }
  `,

  PastJobWithQualificationsFields: `
    fragment PastJobWithQualificationsFields on PastJob {
      ...PastJobFields
      qualifications {
        items {
          ...QualificationWithTopicFields
        }
      }
    }
  `,

  PastJobWithApplicationsFields: `
    fragment PastJobWithApplicationsFields on PastJob {
      ...PastJobFields
      applications {
        items {
          id
          pastJobId
          applicationId
          application {
            ...ApplicationWithJobFields
          }
        }
      }
    }
  `,

  // Junction table fragments
  AwardApplicationFields: `
    fragment AwardApplicationFields on AwardApplication {
      id
      awardId
      applicationId
      createdAt
      updatedAt
    }
  `,

  AwardApplicationWithDataFields: `
    fragment AwardApplicationWithDataFields on AwardApplication {
      ...AwardApplicationFields
      award {
        ...AwardFields
      }
      application {
        ...ApplicationFields
      }
    }
  `,

  EducationApplicationFields: `
    fragment EducationApplicationFields on EducationApplication {
      id
      educationId
      applicationId
      createdAt
      updatedAt
    }
  `,

  EducationApplicationWithDataFields: `
    fragment EducationApplicationWithDataFields on EducationApplication {
      ...EducationApplicationFields
      education {
        ...EducationFields
      }
      application {
        ...ApplicationFields
      }
    }
  `,

  PastJobApplicationFields: `
    fragment PastJobApplicationFields on PastJobApplication {
      id
      pastJobId
      applicationId
      createdAt
      updatedAt
    }
  `,

  PastJobApplicationWithDataFields: `
    fragment PastJobApplicationWithDataFields on PastJobApplication {
      ...PastJobApplicationFields
      pastJob {
        ...PastJobWithQualificationsFields
      }
      application {
        ...ApplicationFields
      }
    }
  `,

  QualificationApplicationFields: `
    fragment QualificationApplicationFields on QualificationApplication {
      id
      qualificationId
      applicationId
      createdAt
      updatedAt
    }
  `,

  QualificationApplicationWithDataFields: `
    fragment QualificationApplicationWithDataFields on QualificationApplication {
      ...QualificationApplicationFields
      qualification {
        ...QualificationWithPastJobFields
      }
      application {
        ...ApplicationFields
      }
    }
  `,

  // Role and Permission fields (for completeness)
  RoleFields: `
    fragment RoleFields on Role {
      id
      name
      displayName
      description
      permissions
      isActive
      createdAt
      updatedAt
    }
  `,

  PermissionFields: `
    fragment PermissionFields on Permission {
      id
      name
      resource
      action
      description
      isActive
    }
  `,

  UserRoleFields: `
    fragment UserRoleFields on UserRole {
      id
      userId
      roleId
      assignedAt
      assignedBy
    }
  `,

  UserRoleWithDataFields: `
    fragment UserRoleWithDataFields on UserRole {
      ...UserRoleFields
      user {
        ...UserBasicFields
      }
      role {
        ...RoleFields
      }
    }
  `,

  UserPermissionFields: `
    fragment UserPermissionFields on UserPermission {
      id
      userId
      permissionId
      assignedAt
      assignedBy
    }
  `,

  UserPermissionWithDataFields: `
    fragment UserPermissionWithDataFields on UserPermission {
      ...UserPermissionFields
      user {
        ...UserBasicFields
      }
      permission {
        ...PermissionFields
      }
    }
  `,
};

/**
 * Helper function to build complete query with fragments
 * Now only includes fragments that are actually used in the query
 */
export function buildQueryWithFragments(query: string): string {
  // Extract fragment names used in the query
  const fragmentPattern = /\.\.\.(\w+)/g;
  const usedFragments = new Set<string>();
  let match;

  while ((match = fragmentPattern.exec(query)) !== null) {
    usedFragments.add(match[1]);
  }

  // Build dependency map for fragments that reference other fragments
  const fragmentDependencies: Record<string, string[]> = {
    UserRoleWithDataFields: ["UserRoleFields", "UserBasicFields", "RoleFields"],
    UserPermissionWithDataFields: [
      "UserPermissionFields",
      "UserBasicFields",
      "PermissionFields",
    ],
    TopicWithJobFields: ["TopicFields", "JobFields"],
    ApplicationWithJobFields: ["ApplicationFields", "JobFields"],
    ApplicationWithJobDetailedFields: [
      "ApplicationFields",
      "JobDetailedFields",
      "UserBasicFields",
    ],
    QualificationWithTopicFields: [
      "QualificationFields",
      "TopicWithJobFields",
      "TopicFields",
      "JobFields",
    ],
    QualificationWithPastJobFields: ["QualificationFields", "TopicFields"],
    QualificationWithApplicationsFields: [
      "QualificationWithPastJobFields",
      "QualificationFields",
      "TopicFields",
      "QualificationApplicationFields",
      "ApplicationWithJobDetailedFields",
      "ApplicationFields",
      "JobDetailedFields",
      "UserBasicFields",
    ],
    PastJobWithQualificationsFields: [
      "PastJobFields",
      "QualificationWithTopicFields",
      "QualificationFields",
      "TopicWithJobFields",
      "TopicFields",
      "JobFields",
    ],
    PastJobWithApplicationsFields: [
      "PastJobFields",
      "PastJobApplicationFields",
      "ApplicationWithJobFields",
      "ApplicationFields",
      "JobFields",
    ],
    AwardApplicationWithDataFields: [
      "AwardApplicationFields",
      "AwardFields",
      "ApplicationFields",
    ],
    EducationApplicationWithDataFields: [
      "EducationApplicationFields",
      "EducationFields",
      "ApplicationFields",
    ],
    PastJobApplicationWithDataFields: [
      "PastJobApplicationFields",
      "PastJobWithQualificationsFields",
      "PastJobFields",
      "QualificationWithTopicFields",
      "QualificationFields",
      "TopicWithJobFields",
      "TopicFields",
      "JobFields",
      "ApplicationFields",
    ],
    QualificationApplicationWithDataFields: [
      "QualificationApplicationFields",
      "QualificationWithPastJobFields",
      "QualificationFields",
      "TopicFields",
      "ApplicationFields",
    ],
  };

  // Recursively add dependencies
  function addDependencies(fragmentName: string, visited = new Set<string>()) {
    if (visited.has(fragmentName)) return;
    visited.add(fragmentName);

    usedFragments.add(fragmentName);
    const deps = fragmentDependencies[fragmentName] || [];
    deps.forEach((dep) => addDependencies(dep, visited));
  }

  // Add dependencies for all used fragments
  Array.from(usedFragments).forEach((fragmentName) => {
    addDependencies(fragmentName);
  });

  // Build the final query with only needed fragments
  const neededFragments = Array.from(usedFragments)
    .filter((name) => FRAGMENTS[name as keyof typeof FRAGMENTS])
    .map((name) => FRAGMENTS[name as keyof typeof FRAGMENTS])
    .join("\n\n");

  return `
    ${neededFragments}
    
    ${query}
  `;
}

/**
 * Helper function to build query with only specific fragments
 * Use this when you want to optimize and only include necessary fragments
 */
export function buildQueryWithSpecificFragments(
  query: string,
  fragmentNames: (keyof typeof FRAGMENTS)[]
): string {
  const selectedFragments = fragmentNames
    .map((name) => FRAGMENTS[name])
    .join("\n\n");

  return `
    ${selectedFragments}
    
    ${query}
  `;
}

/**
 * Get fragments needed for a specific entity type
 * Useful for automatically determining which fragments to include
 */
export function getEntityFragments(
  entityType: string
): (keyof typeof FRAGMENTS)[] {
  const fragmentMap: Record<string, (keyof typeof FRAGMENTS)[]> = {
    User: ["UserFields", "UserBasicFields"],
    Job: [
      "JobFields",
      "JobDetailedFields",
      "TopicFields",
      "TopicWithJobFields",
    ],
    Application: [
      "ApplicationFields",
      "ApplicationWithJobFields",
      "ApplicationWithJobDetailedFields",
    ],
    Award: [
      "AwardFields",
      "AwardApplicationFields",
      "AwardApplicationWithDataFields",
    ],
    Education: [
      "EducationFields",
      "EducationApplicationFields",
      "EducationApplicationWithDataFields",
    ],
    PastJob: [
      "PastJobFields",
      "PastJobWithQualificationsFields",
      "PastJobWithApplicationsFields",
      "PastJobApplicationFields",
      "PastJobApplicationWithDataFields",
    ],
    Qualification: [
      "QualificationFields",
      "QualificationWithTopicFields",
      "QualificationWithPastJobFields",
      "QualificationWithApplicationsFields",
      "QualificationApplicationFields",
      "QualificationApplicationWithDataFields",
    ],
    Resume: ["ResumeFields"],
    Role: ["RoleFields", "UserRoleFields", "UserRoleWithDataFields"],
    Permission: [
      "PermissionFields",
      "UserPermissionFields",
      "UserPermissionWithDataFields",
    ],
  };

  return fragmentMap[entityType] || [];
}
