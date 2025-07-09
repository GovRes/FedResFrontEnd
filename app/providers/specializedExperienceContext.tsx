"use client";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";
import { SpecializedExperienceType } from "../utils/responseSchemas";

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
