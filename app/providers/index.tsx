"use client";

import React, { createContext, useState, ReactNode } from "react";
import {
  AwardType,
  EducationType,
  JobType,
  SpecializedExperienceType,
  StepType,
  TopicType,
  UserJobType,
} from "../utils/responseSchemas";

// Combined interface for state + methods
export interface AllyContextType {
  // State properties
  awards: AwardType[];
  educations: EducationType[];
  email: string;
  job?: JobType;
  keywords: string[];
  loading: boolean;
  loadingText: string;
  name: string;
  resumes?: string[];
  specializedExperiences: SpecializedExperienceType[];
  step: StepType;
  topics?: TopicType[];
  userJobs: UserJobType[];

  // Methods
  setAwards: (value: AwardType[]) => void;
  setEducations: (value: EducationType[]) => void;
  setEmail: (value: string) => void;
  setJob: (value: JobType) => void;
  setKeywords: (value: string[]) => void;
  setLoading: (value: boolean) => void;
  setLoadingText: (value: string) => void;
  setName: (value: string) => void;
  setResumes: (value: string[]) => void;
  setSpecializedExperiences: (value: SpecializedExperienceType[]) => void;
  setStep: (value: StepType) => void;
  setTopics: (value: TopicType[]) => void;
  setUserJobs: (value: UserJobType[]) => void;
}

export const AllyContext = createContext<AllyContextType | undefined>(
  undefined
);

export const AllyProvider = ({ children }: { children: ReactNode }) => {
  // State declarations
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [educations, setEducations] = useState<EducationType[]>([]);
  const [email, setEmail] = useState("");
  // const [job, setJob] = useState<JobType>();
  const [job, setJob] = useState<JobType>({
    agencyDescription:
      "The Navy and Marine Corps team offers innovative, exciting and meaningful work linking military and civilian talents to achieve our mission and safeguard our freedoms. Department of the Navy provides competitive salaries, comprehensive benefits, and extensive professional development and training. From pipefitters to accountants, scientists to engineers, doctors to nurses-the careers and opportunities to make a difference are endless. Civilian careers-where purpose and patriotism unite!",
    department: "Department of the Navy",
    duties:
      "You will assume responsibility for all Navy ERP infrastructure-related services and will be involved in the strategic planning and product evaluation for infrastructure-related activities.; You will apply best practices to develop policies, standards, and frameworks for integrating technologies to support Navy ERP strategies and the associated technical needs of the Navy.; As applicable, you will serve as the Technical SME for initiatives being executed or investigated on behalf of NAVSUP Business Systems Center, the Navy ERP Program Office, PEO MLB, and other agencies.; You will architect and implement innovative technical solutions by strategically applying rigorous project leadership skills and competencies.; You will manage the planning, development, accomplishment, and/or support of some of the largest and most diversified IS/IT systems in the world.; You will resolve policy interpretation in relation to business and technical needs.; You will represent NAVSUP BSC and the Navy ERP Program Office as the expert on all Infrastructure-related issues.; You will represent NAVSUP and the Navy in integrating Navy ERP with various government networks, including, but not limited to, Navy-Marine Corps Intranet (NMCI), Nautilus networks, and OneNet.; You will play a key role in developing and evolving higher-level strategies and coordinating Navy ERP architecture with other Navy and DoD initiatives; You will lead government initiatives and work directly with subject matter experts from various vendors.; You will serve as the point of contact for the Navy ERP Program Office regarding infrastructure matters.; You will represent the Navy ERP Program Office at public meetings/functions to express policy and procedures to stakeholders and mission partners.; You will manage the planning, development, accomplishment, and/or support of some of the largest and most diversified IS/IT systems in the world.",
    evaluationCriteria:
      "In order to qualify for this position, your resume must provide sufficient experience and/or education, knowledge, skills, and abilities to perform the duties of the specific position for which you are being considered. Your resume is the key means we have for evaluating your skills, knowledge, and abilities as they relate to this position. Therefore, we encourage you to be clear and specific when describing your experience. As vacancies occur, the Human Resources Office will review your resume to ensure you meet the hiring eligibility and qualification requirements listed in this flyer. You will be rated based on the information provided in your resume, along with your supporting documentation. If selected, you may be required to provide additional supporting documentation. If after reviewing your resume and supporting documentation, a determination is made that you inflated your qualifications and/or experience, you may be found ineligible/not qualified. Please follow all instructions carefully. Errors or omissions may affect your rating or consideration for employment. All qualification requirements must be met before being considered for any vacancies.",
    qualificationsSummary:
      'There is a Basic Requirement for the position. See the "Education" section of this announcement for details. To qualify for the GS-2210-14, in addition to meeting the Basic Requirement, your resume must demonstrate that you have at least one year of specialized experience equivalent to the next lower grade level (GS-13) or pay band in the federal service or equivalent experience in the private or public performing work that involves a wide range of IT management activities that extend and apply to an entire organization or major components of an organization such as strategic planning, capital planning and investment control, workforce planning, policy and standards development, resource management, knowledge management, auditing, and information security management and performing the following: 1) Applying principles, concepts, methods, and practices related to the IT Infrastructure environment and the organization\'s business processes. 2) Applying knowledge of industry technological capabilities and an in-depth understanding of the current infrastructure environment to transition an organization to an efficient future environment 3) Assisting in developing strategic plans for the future infrastructure environment and determining technical strategy for the Command or Corporation in consonance with organizational mission and goals. 4) Applying specialized/comprehensive knowledge of IT concepts and techniques combined with a general understanding of supply/financial systems to manage the development of the Infrastructure Landscape throughout a Command, Organization, or Corporation. 5) Applying Cyber Security/Risk Management Framework Requirements. 6) Applying program management principles, including an understanding of Continuous Process Improvement (CPI), to implement, enforce, and advocate the CPI process within the Command. 7) Effectively communicating technical and programmatic information, concepts, and positions. 8) Applying the principles and techniques of procedure analysis as applied to the study and evaluation of diversified customer operations and organizations to evaluate alternative IT solutions to customer problems There is no educational substitution for Specialized Experience in this series at this grade level. Additional qualification information can be found from the following Office of Personnel Management website:https://www.opm.gov/policy-data-oversight/classification-qualifications/general-schedule-qualification-standards/2200/information-technology-it-management-series-2210-alternative-a/ Experience refers to paid and unpaid experience, including volunteer work done through National Service programs (e.g., professional, philanthropic, religious, spiritual, community, student, social). Volunteer work helps build critical competencies, knowledge, and skills and can provide valuable training and experience that translates directly to paid employment.',
    requiredDocuments:
      "A complete resume is required. Your resume must show relevant experience, job title, duties and accomplishments. Your resume must show complete information for each job entry to support minimum qualifications. The following information should be provided in your resume, but it is acceptable to provide elsewhere in your application package: employer's name, starting and end dates (Mo/Yr), hours per week, and pay plan, series and grade level (e.g. GS-0201-09) for relevant federal experience. TIP: A good way to ensure you include all essential information is to use the Resume Builder in USAJOBS to create your resume. Are you claiming membership in any professional organizations, or possession of a license, certificate or credentials? Check the Conditions of Employment section above to see if any are required. If you claim membership, license, certification, or credentials, you must submit a copy of said document in your application package. Are you using education as a substitute for some or all of the experience requirement? Is there a basic education requirement for this position? Check the Education section above to see what is allowed and what is required. Any claims you make in your resume or assessment questionnaire regarding education or degrees MUST be supported by submitting with your application official or unofficial transcripts or a list of courses, grades earned, completion dates, and quarter and semester hours earned issued from your school. While unofficial transcripts are acceptable for initial application, an official transcript will ultimately be required if you are selected for the position. You may submit a copy your degree(s) if specific coursework does not have to be verified. Are you a veteran claiming 5-point veterans' preference or claiming sole survivorship preference? You must submit a copy of your latest DD-214 Certificate of Release or Discharge from Active Duty (any copy that shows all dates of service, as well as character of service [Honorable, General, etc.] is acceptable) OR a VA letter that shows dates of service or service connected disability AND character of service. If you have more than one DD-214 for multiple periods of active duty service, submit a copy for each period of service. If you were issued a DD-215 to amend aforementioned information on the DD-214 you must submit that too. If you are not sure of your preference eligibility, visit the Department of Labor's website: Veterans' Preference Advisor Are you a disabled veteran or claiming 10-point veterans' preference? If you are eligible to claim 10 point veterans preference you must submit a DD-214 Certificate of Release or Discharge from Active Duty as described above for 5-point preference. You must also provide the applicable supporting documentation of your disability (e.g. disability letter from the VA) as described on Standard Form-15 (SF-15). http://www.opm.gov/forms/pdf_fill/SF15.pdf. Are you an active duty service member? Active Duty Service Members are required to submit a statement of service printed on command letterhead and signed by the command. The statement of service must provide the branch of service, rate/rank, all dates of service, the expected date of discharge and anticipated character of service (Honorable, General, etc.). Documents submitted as part of the application package, to include supplemental documents, may be shared beyond the Human Resources Office. Some supplemental documents contain personal information such as SSN and DOB and some documents such as military orders and marriage certificates may contain personal information for someone other than you. You may sanitize these documents to remove said personal information before you submit your application. You must provide an un-sanitized version of the documents if you are selected.",
    title: "IT SPECIALIST (POLICY PLANNING)",
  });
  const [keywords, setKeywords] = useState<string[]>([]);
  const [name, setName] = useState("");
  // const [resumes, setResumes] = useState<string[]>();
  const [resumes, setResumes] = useState<string[]>([
    "HANNAH LOPEZ  1721 Pilots Lane Chicago, IL, 60616 Cell Phone: (555) 555-1234 Email: hlopez@email.com Citizenship: U.S. Citizen Veterans’ Preference: No Highest GS Grade: N/A Security Clearance: N/A Desired Location: US-IL-Cook County-Chicago  PROFESSIONAL SUMMARY  Motivated Information Technology professional with skills in application development and support. Proven experience with application upgrades, computer maintenance, troubleshooting and help desk support across a variety of environments including Windows and Linux. Works well in a team, able to take and give direction and used to high-pressure situations. Self-motivated and determined to see a task through to the end. Good time management skills, able to handle multiple projects. Excellent communicator, both orally and written. Twice recognized for outstanding customer support.  EMPLOYMENT HISTORY  SYSTEM SUPPORT SPECIALIST , 40 hrs/week—04/23/2015–Present First American Bank, 123 Cherry Harvest Lane, Chicago, IL, 60616 Manager: Brian Briggs (773) 555-5656. May contact.  Responsibilities:  ●   Managing and maintaining software and applications used by the Auto Services line of business.  ●   Liaising with vendor support to troubleshoot and fix third-party software issues.  ●   Installing server and operating system updates.  ●   Monitoring for potential malware or other server attacks. Managing software upgrades.  ●   Managing, maintaining and repairing hardware (PCs, printers, and servers) used by the Auto Services line of business. Working with vendors to troubleshoot printer issues.  ●   Designing and developing small productivity applications for the business using C# and Access.  ●   Interfacing with business partners, providing telephone and face-to-face assistance with their needs.  Accomplishments:  ●   Received corporate recognition award for customer service in February 2018.  ●   Developed an application for performing special billing functionality not supported by the business’s third-party software.  ●   Kept business going when the servers went down during peak hours. Re-routed traffic to backup servers, traced the fault, fixed it and restored production servers within two hours.  SYSTEM SUPPORT ANALYST,   40 hrs/week—1/10/2013–04/23/2015 First American Bank, 123 Cherry Harvest Lane, Chicago, IL, 60616 Manager: Brian Briggs (773) 555-5656. May contact.  Responsibilities:  ●   Maintaining software and applications used by the Auto Services line of business. Installing operating system updates.  ●   Maintaining and repairing hardware (PCs, printers, and servers) used by the Auto Services line of business.  ●   Providing telephone and face-to-face assistance to our business partners.●   Creating reports for management using Microsoft Word and Excel. Developing PowerPoint presentations for the monthly IT team meeting.  Accomplishments:  ●   Received corporate recognition for customer service, 09/21/2014.  ●   Consistently completed federal regulatory reporting ahead of schedule every month between 2013 and 2015.  ●   Received MCSE Certification (Microsoft Certified Solutions Expert), March 2015.  HELP DESK SUPPORT,   40 hrs/week—07/03/2011–11/10/2013 First American Bank, 123 Cherry Harvest Lane, Chicago, IL, 60616 Manager: Julie-Ann Glover (773) 555-0902. May contact.  Responsibilities:  ●   Providing level 3 technology phone support.  ●   Assisting employees with software and hardware issues. Using screen-sharing technology to access employee workstations for enhanced support.  ●   Logging help desk tickets and working through assigned tickets.  ●   Maintaining and updating the help desk internal wiki page.  ●   Creating weekly reports for management using Crystal Reports.  Accomplishments:  ●   Successfully mentored 12 new hires to the help desk between 2011 and 2013.  ●   Completed training in C# and advanced server maintenance.  TECH SUPPORT ASSISTANT,   40 hrs/week—06/22/2008–07/03/2011 FirstCare Hospital, 903 Surgery Street, Chicago, IL, 60616 Manager: Terry Flynn (773) 555-8398. May contact.  Responsibilities:  ●   Providing level 1 and 2 technology phone support.  ●   Assessing and redirecting support calls for further assistance.  ●   Helping employees with basic computer and software issues.  ●   Logging support tickets into the help desk management system.  ●   Generating reports from the help desk management system using Crystal Reports and Access.  Accomplishments:  ●   Completed training in software support and computer maintenance.  ●   Received the IT “Star Help” award for excellence in tech support.  EDUCATION  University of Illinois, IL, 61820  Bachelor of Arts, Business,   magna cum laude —2008 Concentration: Business technology; 128 semester hours GPA: 3.6/4.0  Terrence B. Outhwaite High School, Chicago, IL, 60007  High School Diploma—2004 GPA: 3.9/4.0  ADDITIONAL TRAINING  ●   Visual Basic for Applications, Chicago Community College, 06/2004  ●   UNIX Essentials, Chicago Technical College, 10/2013  ●   Linux for UNIX Users, Chicago Technical College, 02/2014  PROGRAMMING LANGUAGES  ●   C# (Proficient)  ●   JavaScript (Proficient)●   HTML/CSS (Proficient)  VOLUNTEER WORK  ●   Animal Rescue Center, Downtown Chicago, IL  ●   Tech4All, a community initiative to train disadvantaged kids to use and maintain computers, Chicago, IL  AFFILIATIONS  ●   Phi Sigma Rho, 2004-2008",
  ]);
  // const [specializedExperiences, setSpecializedExperiences] = useState<
  //   SpecializedExperienceType[]
  // >([]);
  const [specializedExperiences, setSpecializedExperiences] = useState<
    SpecializedExperienceType[]
  >([
    {
      id: "8wj5k6ap2x",
      title: "Certified Information Systems Security Professional (CISSP)",
      description:
        "The CISSP is a globally recognized certification offered by (ISC)² that demonstrates an individual's knowledge and expertise in cybersecurity practices, risk management framework requirements, and information security management.",
      userConfirmed: true,
      paragraph:
        "Certified Information Systems Security Professional (CISSP) certification obtained in 2003 through an in-person IT Security bootcamp run by Girl Develop It in Brooklyn.",
      initialMessage:
        "I'm going to help you write a paragraph about obtaining your CISSP certification. We will include this in your application to become an IT Manager at the Department of Defense. Can you tell me about your experience studying for and attaining this certification?",
      typeOfExperience: "certification",
    },
    {
      id: "u3j6p8zl1n",
      title: "Master's in Information Technology Management",
      description:
        "A Master's degree in Information Technology Management from an accredited institution, focusing on managing IT systems, policy development, and resource management aligned with organizational goals.",
      userConfirmed: true,
      paragraph:
        "Master's in Information Technology Management from James Madison University, earned in 2019. Graduated in the top 1% of the class and received recognition for an outstanding thesis project.",
      initialMessage:
        "I'm going to help you write a paragraph about your Master's in Information Technology Management. We will include this in your application to become an IT Manager at the Department of Defense. Can you share some details about your coursework and projects during this program?",
      typeOfExperience: "degree",
    },
    {
      id: "7qk2rj4ztg",
      title: "Experience with IT Strategic Planning",
      description:
        "Demonstrated experience in developing and implementing strategic IT plans that align with organizational goals, ensuring the effective management of technology resources across the organization.",
      userConfirmed: true,
      paragraph:
        "From 2019 to 2024 at Segra Networks, I created a 10-year plan aimed at improving the energy efficiency of our data centers. This plan included securing a government subsidy to install solar panels on the roofs of the data centers and upgrading our oldest servers to more efficient, newer machines.",
      initialMessage:
        "I'm going to help you write a paragraph about your experience with IT strategic planning. We will use this for your application to become an IT Manager at the Department of Defense. Can you describe a specific strategic plan you developed or contributed to?",
      typeOfExperience: "experience",
    },
  ]);
  const [step, setStep] = useState<StepType>("education");
  // const [step, setStep] = useState<StepType>("usa_jobs");
  // const [topics, setTopics] = useState<TopicType[]>();
  const [topics, setTopics] = useState<TopicType[]>([
    {
      id: "X1M9Y2F4D6",
      title: "Technical Skills",
      keywords: [
        "Navy ERP infrastructure-related services",
        "integrating technologies to support Navy ERP",
        "architect and implement innovative technical solutions",
        "manage IS/IT systems",
      ],
      description:
        "Skills related to technical aspects of Navy ERP and IT management.",
      evidence: "",
      question: "",
    },
    {
      id: "N5A8Q1B3F4",
      title: "Project Management",
      keywords: [
        "project leadership skills",
        "lead government initiatives",
        "coordinate Navy ERP architecture",
      ],
      description:
        "Skills related to managing projects and leading initiatives within the Navy ERP framework.",
      evidence: "",
      question: "",
    },
    {
      id: "U3V5P8D2T9",
      title: "Strategic Planning",
      keywords: [
        "strategic planning",
        "develop higher-level strategies",
        "develop policies and standards",
        "product evaluation for infrastructure activities",
      ],
      description:
        "Skills related to planning and developing policies for Navy ERP infrastructure.",
      evidence: "",
      question: "",
    },
    {
      id: "K7R4T9E8Z2",
      title: "Representation & Communication",
      keywords: [
        "represent NAVSUP BSC and Navy ERP",
        "public meetings/functions representation",
        "point of contact for infrastructure matters",
      ],
      description:
        "Skills focused on communication and representation of Navy ERP initiatives and policies.",
      evidence: "",
      question: "",
    },
    {
      id: "L6B5C8H3P8",
      title: "Policy Management",
      keywords: [
        "resolve policy interpretation",
        "support of diversified IS/IT systems",
      ],
      description:
        "Skills related to managing and interpreting policies in relation to the Navy ERP.",
      evidence: "",
      question: "",
    },
  ]);
  // const [userJobs, setUserJobs] = useState<UserJobType[]>([]);
  const [userJobs, setUserJobs] = useState<UserJobType[]>([
    {
      endDate: "2022-08-01",
      hours: "40",
      gsLevel: "GS-12",
      id: "job1",
      startDate: "2019-05-01",
      organization: "Department of Energy",
      title: "Energy Analyst",
      responsibilities:
        "Conducted analysis of energy policies and regulations, assessing their impact on market structures and consumer behavior.",
      userJobQualifications: [
        {
          id: "a1b2c3d4e5",
          topic: {
            id: "1",
            title: "Energy Policy",
            keywords: ["regulations", "market analysis", "consumer behavior"],
            description:
              "Knowledge and experience in analyzing energy policies and their implications on markets and stakeholders.",
            evidence:
              "Demonstrated understanding through policy analysis reports.",
            question: "Describe a time you analyzed a policy.",
          },
          description:
            "Knowledge and experience in analyzing energy policies and their implications on markets and stakeholders.",
          title: "Energy Policy Analysis",
          paragraph: "",
          userConfirmed: false,
        },
        {
          id: "f6g7h8i9j0",
          topic: {
            id: "2",
            title: "Quantitative Analysis",
            keywords: ["data analysis", "modeling", "statistical methods"],
            description:
              "Proficiency in data analysis techniques and statistical modeling to derive insights from complex datasets.",
            evidence:
              "Utilized statistical models in reporting for energy consumption patterns.",
            question: "What models have you built and for what purpose?",
          },
          description:
            "Proficiency in data analysis techniques and statistical modeling to derive insights from complex datasets.",
          title: "Statistical Modeling Expertise",
          paragraph: "",
          userConfirmed: false,
        },
      ],
    },
    {
      endDate: "2020-12-31",
      hours: "35",
      gsLevel: "GS-11",
      id: "job2",
      startDate: "2017-01-15",
      organization: "Environmental Protection Agency",
      title: "Environmental Scientist",
      responsibilities:
        "Performed environmental assessments and contributed to policy development regarding air and water quality standards.",
      userJobQualifications: [
        {
          id: "k1l2m3n4o5",
          topic: {
            id: "3",
            title: "Environmental Standards",
            keywords: ["air quality", "water quality", "compliance"],
            description:
              "Experience in developing and assessing environmental standards and compliance measures related to air and water quality.",
            evidence:
              "Engaged in creating compliance strategies for water regulations.",
            question:
              "How have you ensured compliance with environmental standards?",
          },
          description:
            "Experience in developing and assessing environmental standards and compliance measures related to air and water quality.",
          title: "Compliance with Environmental Standards",
          paragraph: "Did the greatest job ever at the EPA",
          userConfirmed: false,
        },
        {
          id: "p6q7r8s9t0",
          topic: {
            id: "4",
            title: "Policy Development",
            keywords: [
              "regulatory frameworks",
              "stakeholder engagement",
              "drafting policies",
            ],
            description:
              "Skills in drafting policies and engaging stakeholders for effective policy implementation.",
            evidence:
              "Collaborated with local governments on water quality initiatives.",
            question: "What has been your role in policy drafting?",
          },
          description:
            "Skills in drafting policies and engaging stakeholders for effective policy implementation.",
          title: "Stakeholder Engagement in Policy Development",
          paragraph: "",
          userConfirmed: false,
        },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  // Context value object - spread all values directly
  const value = {
    awards,
    educations,
    email,
    job,
    keywords,
    loading,
    loadingText,
    name,
    resumes,
    specializedExperiences,
    step,
    topics,
    userJobs,
    setAwards,
    setEducations,
    setEmail,
    setJob,
    setKeywords,
    setLoading,
    setLoadingText,
    setName,
    setResumes,
    setSpecializedExperiences,
    setStep,
    setTopics,
    setUserJobs,
  };

  return <AllyContext.Provider value={value}>{children}</AllyContext.Provider>;
};
