/*
put on each search:
keyword
job title
location
radius
remote only?
position schedule
travel requirement
pay grade (GS) - min max
salary desired - min max

filter on "PositionOfferingType" - rule out "15668": "Agency Employees Only" if user not employed by agency
*/

export const academicLevels = {
    "03": "Some high school (no diploma)",
    "04": "High school diploma or equivalent",
    "06": "Technical or occupational certificate",
    "10": "Associate's degree",
    "12": "Some college (no degree)",
    "13": "Bachelor's degree",
    "17": "Master's degree",
    "21": "Doctorate degree",
    "22": "Professional degree (e.g. MD, JD, DDS)"
}

export const disabilities = {
    "01": "Deaf or serious difficulty hearing",
    "02": "Blind or serious difficulty seeing even when wearing glasses",
    "03": "Missing an arm, leg, hand or foot",
    "04": "Paralysis: partial or complete paralysis (any cause)",
    "05": "Significant disfigurement: for example, severe disfigurements caused by burns, wounds, accidents or congenital disorders",
    "06": "Significant mobility impairment: for example, uses a wheelchair, scooter, walker or uses a leg brace to walk",
    "07": "Significant psychiatric disorder: for example, bipolar disorder, schizophrenia, PTSD or major depression",
    "08": "Intellectual disability",
    "09": "Developmental disability: for example, cerebral palsy or autism spectrum disorder",
    "10": "Traumatic brain injury",
    "11": "Dwarfism",
    "12": "Epilepsy or other seizure disorder",
    "13": "Other disability or serious health condition:  for example, diabetes, cancer, cardiovascular disease, anxiety disorder or HIV infection; a learning disability, a speech impairment or a hearing impairment",
    "14": "Alcoholism",
    "15": "Cancer",
    "16": "Cardiovascular or heart disease",
    "17": "Crohn's disease, irritable bowel syndrome or other gastrointestinal impairment",
    "18": "Depression, anxiety disorder or other psychological disorder",
    "19": "Diabetes or other metabolic disease",
    "20": "Difficulty seeing even when wearing glasses",
    "21": "Hearing impairment",
    "22": "History of drug addiction (but not currently using illegal drugs)",
    "23": "HIV Infection/AIDS or other immune disorder",
    "24": "Kidney dysfunction: for example, requires dialysis",
    "25": "Learning disabilities or ADHD",
    "26": "Liver disease: for example, hepatitis or cirrhosis",
    "27": "Lupus, fibromyalgia, rheumatoid arthritis or other autoimmune disorder",
    "28": "Morbid obesity",
    "29": "Nervous system disorder: for example, migraine headaches, Parkinson's disease or multiple sclerosis",
    "30": "Non-paralytic orthopedic impairments: for example, chronic pain, stiffness, weakness in bones or joints or some loss of ability to use parts of the body",
    "31": "Orthopedic impairments or osteo-arthritis",
    "32": "Pulmonary or respiratory impairment: for example, asthma, chronic bronchitis or TB",
    "33": "Sickle cell anemia, hemophilia or other blood disease",
    "34": "Speech impairment",
    "35": "Spinal abnormalities: for example, spina bifida or scoliosis",
    "36": "Thyroid dysfunction or other endocrine disorder",
    "37": "Other",
    "38": "None of the conditions listed above apply to me.",
    "39": "I do not wish to answer questions regarding my disability/health conditions.",
    "40": "I do not wish to specify any condition."
}

export const ethnicity = {}

export const race = {
    "2": "American Indian or Alaska Native - A person having origins in any of the original peoples of North or South America (including Central America) and who maintains tribal affiliation or community attachment.",
    "3": "Asian - A person having origins in any of the original peoples of the Far East, Southeast Asia or the Indian subcontinent, including, for example, Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippine Islands, Thailand or Vietnam.",
    "4": "Black or African American - A person having origins in any of the black racial groups of Africa.",
    "5": "Native Hawaiian or other Pacific Islander - A person having origins in any of the original peoples of Hawaii, Guam, Samoa or other Pacific islands.",
    "6": "White - A person having origins in any of the original peoples of Europe, the Middle East or North Africa.",
}

export const federalEmploymentStatus = {
    "CURRENT-FED": "I am currently a federal civilian employee.",
    "FORMER-FED": "I am a former federal civilian employee with reinstatement eligibility.",
    "FORMER-FED-REINST": "I am a former federal civilian employee but do not have reinstatement eligibility.",
    "NON-FED": "I am not and have never been a federal civilian employee."
}

export const hiringPath = {
    "DISABILITY": "Individuals with disabilities",
    "FED": "Federal employees",
    "FED-AGENCY": "Federal employees - Agency wide",
    "FED-COMPETITIVE": "Federal employees - Competitive service",
    "FED-EXCEPTED": "Federal employees - Excepted service",
    "FED-INTERNAL-NOSEARCH": "Internal to an agency - does not appear on USAJOBS",
    "FED-INTERNAL-SEARCH": "Internal to an agency - appears on USAJOBS",
    "FED-TRANSITION": "Career transition (CTAP, ICTAP, RPL)",
    "GRADUATES": "Recent graduates",
    "LAND": "Land & base management",
    "MSPOUSE": "Military spouses",
    "NATIVE": "Native Americans",
    "NGUARD": "National Guard & Reserves",
    "NOPUBLIC": "Custom announcement",
    "OVERSEAS": "Family of overseas employees",
    "PEACE": "Peace Corps & AmeriCorps Vista",
    "PUBLIC": "The public",
    "SES": "Senior executives",
    "SPECIAL-AUTHORITIES": "Special authorities",
    "STUDENT": "Students",
    "VET": "Veterans",
}

export const securityClearance = {
    "0": "Not Required",
    "1": "Confidential",
    "2": "Secret",
    "3": "Top Secret",
    "4": "Sensitive Compartmented Information",
    "5": "Q Access Authorization",
    "6": "Q - Nonsensitive",
    "7": "L Access Authorization",
    "8": "Other",
    "9": "Public Trust - Background Investigation",
}

export const specialHiring = {
    "DISVET30": "30 Percent or More Disabled Veteran",
    "DISVETTR": "Disabled veterans who have completed a VA training program",
    "MILSPOUSE": "Military Spouse",
    "MILSPOUSEOS": "Certain former overseas military spouse employees",
    "SCHEDA": "Schedule A Disabled",
    "VRA": "Veterans Recruitment Appointment (VRA)",
}

export const whoMayApply = {
    "15509": "Agency Employees Only",
    "15510": "Qualified Current Civil Service Employees",
    "15511": "Agency Employees Only",
    "15513": "Status Candidates (Merit Promotion and VEOA Eligibles) ",
    "15514": "United States Citizens ",
    "15515": "US Citizens and Non-Citizens ",
    "15516": "Student/Internship Program Eligibles ",
    "15523": "US Citizens and Status Candidates ",
    "15580": "Current members of the Senior Executive Service",
    "15590": "Veterans/Family members with qualifying military service only",
    "15669": "Public",
    "26985": "United States Citizens ",
    "29555": "Qualified CTAP Eligibles",
    "29556": "Qualified ICTAP or VEOA Eligibles",
    "45575": "All groups of qualified individuals ",
    "45576": "All groups of qualified individuals within the civil service ",
    "45577": "Qualified ICTAP Eligibles",
    "45578": "Qualified VEOA Eligibles",
}

export const agencies = {
    "AF": "Department of the Air Force",
    "AG": "Department of Agriculture",
    "AH": "National Foundation on the Arts and the Humanities",
    "CI": "Central Intelligence Agency",
    "AR": "Department of the Army",
    "CM": "Department of Commerce",
    "DD": "Department of Defense",
    "DJ": "Department of Justice",
    "DN": "Department of Energy",
    "ED": "Department of Education",
    "EOP": "Executive Office of the President",
    "FQ": "Court Services and Offender Supervision Agency for DC",
    "GS": "General Services Administration",
    "HE": "Department of Health and Human Services",
    "HS": "Department of Homeland Security",
    "HU": "Department of Housing and Urban Development",
    "IN": "Department of the Interior",
    "JL": "Judicial Branch",
    "LL": "Legislative Branch",
    "NN": "National Aeronautics and Space Administration",
    "NV": "Department of the Navy",
    "RH": "Armed Forces Retirement Homes",
    "SM": "Smithsonian Institution",
    "ST": "Department of State",
    "TB": "National Transportation Safety Board",
    "TD": "Department of Transportation",
    "TR": "Department of the Treasury",
    "VA": "Department of Veterans Affairs",
}

export const travelPercentage = {
        "0":	"Not Required",
        "1":	"Occasional Travel",
        "2":	"25% or Less",
        "5":	"50% or Less",
        "7":	"75% or Less",
        "8":	"76% or Greater",
}

export const positionScheduleType = {
    "1":	"Full-Time",
    "2":	"Part-Time",
    "3":	"Shift Work",
    "4":	"Intermittent",
    "5":	"Job Sharing",
    "6":	"Multiple Schedules",
}

export const gender ={
    "M": "Male",
    "F": "Female",
    "NB": "Nonbinary or other"
}