"use client"

import { createContext, useContext, ReactNode, useState } from 'react'

interface SampleData {
  columns: string[]
  data: Record<string, any>[]
}

interface VariableStats {
  min: number
  max: number
  mean: number
  std: number
  missing: number
}

interface VariableSummary {
  [key: string]: VariableStats
}

export interface Variable {
  id: number | string
  name: string
  label: string
  type: string
  [key: string]: any
}

interface DataContextType {
  data: any
  setData: (data: any) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  dataFile: File | null
  setDataFile: (file: File | null) => void
  dataLoaded: boolean
  setDataLoaded: (loaded: boolean) => void
  variables: Variable[]
  setVariables: (variables: Variable[]) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [dataFile, setDataFile] = useState<File | null>(null)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)
  const [variables, setVariables] = useState<Variable[]>([])

  return (
    <DataContext.Provider value={{ 
      data, 
      setData,
      isLoading,
      setIsLoading,
      error,
      setError,
      dataFile,
      setDataFile,
      dataLoaded,
      setDataLoaded,
      variables,
      setVariables
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
} 