"use client"

import { FileSpreadsheet, BarChart3, Table2, Bot } from "lucide-react"

const features = [
  {
    name: "SPSS File Support",
    description: "Upload and analyze SPSS (.sav) files with ease",
    icon: FileSpreadsheet,
  },
  {
    name: "Cross-Tabulation",
    description: "Create complex cross-tabs and banner tables",
    icon: Table2,
  },
  {
    name: "Visualizations",
    description: "Generate charts and graphs from your analysis",
    icon: BarChart3,
  },
  {
    name: "AI Assistant",
    description: "Get help with your analysis from our AI agent",
    icon: Bot,
  },
]

export function Features() {
  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold">Key Features</h2>
        <p className="text-muted-foreground mt-2">Powerful tools to analyze your SPSS data</p>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="flex flex-col items-center text-center p-6 rounded-lg border bg-card shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.name}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
