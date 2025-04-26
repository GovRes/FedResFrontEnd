"use client";
import {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";
import { JobSearchObject } from "../components/ally/usaJobsComponents/UsaJobsSearch";

export interface JobSearchContextType {
  searchResults: any[];
  setSearchResults: Dispatch<SetStateAction<any[]>>;
  searchObject: JobSearchObject | null;
  setSearchObject: Dispatch<SetStateAction<JobSearchObject | null>>;
}

// Create a default value for the context
const defaultContextValue: JobSearchContextType = {
  searchResults: [],
  setSearchResults: () => {},
  searchObject: null,
  setSearchObject: () => {},
};

// Provide the default value when creating the context
export const JobSearchContext =
  createContext<JobSearchContextType>(defaultContextValue);

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
