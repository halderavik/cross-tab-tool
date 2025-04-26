import React, { createContext, useContext, ReactNode, useState } from 'react'

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

interface DataContextType {
  sampleData: SampleData | null
  setSampleData: (data: SampleData | null) => void
  variableSummary: VariableSummary | null
  setVariableSummary: (summary: VariableSummary | null) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [sampleData, setSampleData] = useState<SampleData | null>(null)
  const [variableSummary, setVariableSummary] = useState<VariableSummary | null>(null)

  return (
    <DataContext.Provider value={{ 
      sampleData, 
      setSampleData,
      variableSummary,
      setVariableSummary
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