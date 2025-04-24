"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface DataContextType {
  dataFile: File | null
  setDataFile: (file: File | null) => void
  dataLoaded: boolean
  setDataLoaded: (loaded: boolean) => void
  variables: any[]
  setVariables: (variables: any[]) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [dataFile, setDataFile] = useState<File | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [variables, setVariables] = useState<any[]>([])

  // Mock data for variables when in development/preview mode
  useEffect(() => {
    // Only set mock data if we're in development and no real data is loaded
    if (process.env.NODE_ENV === "development" && !dataLoaded && variables.length === 0) {
      setVariables([
        { id: 1, name: "age", label: "Age of respondent", type: "numeric", values: [] },
        { id: 2, name: "gender", label: "Gender", type: "categorical", values: ["Male", "Female", "Other"] },
        { id: 3, name: "income", label: "Annual income", type: "numeric", values: [] },
        {
          id: 4,
          name: "education",
          label: "Education level",
          type: "ordinal",
          values: ["High School", "Bachelor", "Master", "PhD"],
        },
      ])
    }
  }, [dataLoaded, variables.length])

  const value = {
    dataFile,
    setDataFile,
    dataLoaded,
    setDataLoaded,
    variables,
    setVariables,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
