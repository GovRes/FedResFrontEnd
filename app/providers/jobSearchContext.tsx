"use client";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { JobSearchObject } from "../utils/responseSchemas";

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

export function useJobSearch() {
  const context = useContext(JobSearchContext);
  if (context === undefined) {
    throw new Error("useApplication must be used within a ApplicationProvider");
  }
  return context;
}
