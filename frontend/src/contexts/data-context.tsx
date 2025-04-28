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
  conditions?: any[]
  [key: string]: any
}

interface DataFile {
  file: File | null
  filePath: string | null
  name: string | null
  id?: number | null
}

export interface DataContextType {
  data: any
  setData: (data: any) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  dataFile: DataFile | null
  setDataFile: (file: DataFile | null) => void
  dataLoaded: boolean
  setDataLoaded: (loaded: boolean) => void
  variables: Variable[]
  setVariables: (variables: Variable[]) => void
  sampleData: SampleData | null
  setSampleData: (data: SampleData | null) => void
  variableSummary: VariableSummary | null
  setVariableSummary: (summary: VariableSummary | null) => void
  fileType: 'spss' | 'csv' | null
  setFileType: (type: 'spss' | 'csv' | null) => void
  addCustomVariable: (variable: Variable) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [dataFile, setDataFile] = useState<DataFile | null>(null)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)
  const [variables, setVariables] = useState<Variable[]>([])
  const [sampleData, setSampleData] = useState<SampleData | null>(null)
  const [variableSummary, setVariableSummary] = useState<VariableSummary | null>(null)
  const [fileType, setFileType] = useState<'spss' | 'csv' | null>(null)

  const addCustomVariable = (variable: Variable) => {
    setVariables(prev => [...prev, variable])
    
    if (data) {
      const processedData = data.map((row: any) => {
        const matchesConditions = variable.conditions?.every((condition: any) => {
          const value = row[condition.column]
          switch (condition.comparison) {
            case 'equals':
              return value === condition.value
            case 'contains':
              return String(value).includes(condition.value)
            case 'greater_than':
              return Number(value) > Number(condition.value)
            case 'less_than':
              return Number(value) < Number(condition.value)
            default:
              return false
          }
        })

        return {
          ...row,
          [variable.name]: matchesConditions ? 1 : 0
        }
      })

      setData(processedData)
    }
  }

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
      setVariables,
      sampleData,
      setSampleData,
      variableSummary,
      setVariableSummary,
      fileType,
      setFileType,
      addCustomVariable
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