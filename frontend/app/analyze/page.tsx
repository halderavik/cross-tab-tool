import type { Metadata } from "next"
import { AnalysisWorkspace } from "@/components/analysis-workspace"

export const metadata: Metadata = {
  title: "Analyze Data - Cross-Tab Platform",
  description: "Perform cross-tabulations and statistical analysis on your data",
}

export default function AnalyzePage() {
  return (
    <div className="w-full min-h-screen px-0 py-0">
      <AnalysisWorkspace skipUploadCheck={true} />
    </div>
  )
}
