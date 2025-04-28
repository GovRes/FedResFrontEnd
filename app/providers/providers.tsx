"use client";
import {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";
import {
  JobSearchObject,
  SpecializedExperienceType,
} from "@/app/utils/responseSchemas";

export interface JobSearchContextType {
  searchResults: any[];
  setSearchResults: Dispatch<SetStateAction<any[]>>;
  searchObject: JobSearchObject | null;
  setSearchObject: Dispatch<SetStateAction<JobSearchObject | null>>;
}

// Create a default value for the context
const defaultJobSearchContextValue: JobSearchContextType = {
  searchResults: [],
  setSearchResults: () => {},
  searchObject: null,
  setSearchObject: () => {},
};

// Provide the default value when creating the context
export const JobSearchContext = createContext<JobSearchContextType>(
  defaultJobSearchContextValue
);

export function JobSearchProvider({ children }: { children: ReactNode }) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchObject, setSearchObject] = useState<JobSearchObject | null>(
    null
  );

  return (
    <JobSearchContext.Provider
      value={{
        searchResults,
        setSearchResults,
        searchObject,
        setSearchObject,
      }}
    >
      {children}
    </JobSearchContext.Provider>
  );
}

export interface SpecializedExperienceContextType {
  specializedExperiences: SpecializedExperienceType[];
  setSpecializedExperiences: Dispatch<
    SetStateAction<SpecializedExperienceType[]>
  >;
}

// Create a default value for the context
const defaultSpecializedExperienceContextValue: SpecializedExperienceContextType =
  {
    specializedExperiences: [],
    setSpecializedExperiences: () => {},
  };

// Provide the default value when creating the context
export const SpecializedExperienceContext =
  createContext<SpecializedExperienceContextType>(
    defaultSpecializedExperienceContextValue
  );

export function SpecializedExperienceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [specializedExperiences, setSpecializedExperiences] = useState<
    SpecializedExperienceType[]
  >([]);

  return (
    <SpecializedExperienceContext.Provider
      value={{
        specializedExperiences,
        setSpecializedExperiences,
      }}
    >
      {children}
    </SpecializedExperienceContext.Provider>
  );
}
