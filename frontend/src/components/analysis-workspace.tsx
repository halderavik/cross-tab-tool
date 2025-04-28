"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { VariableSelector } from "@/components/variable-selector"
import { CrosstabBuilder } from "@/components/crosstab-builder"
import { ResultsViewer } from "@/components/results-viewer"
import { ChatAssistant } from "@/components/chat-assistant"
import { AIAgentChat } from "@/components/AIAgent/AIAgentChat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"
import { useData } from "@/contexts/data-context"
import { FileUploader } from "@/components/file-uploader"
import { ArrowLeft, Bot, BarChart3, Table2, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { CustomVariableBuilder } from "@/components/custom-variable-builder"
import { DataViewer } from "@/components/data-viewer"
import type { Variable } from "@/contexts/data-context"
import type { CustomVariable } from "@/components/custom-variable-builder"

export function AnalysisWorkspace({ skipUploadCheck = false }: { skipUploadCheck?: boolean }) {
  const [activeTab, setActiveTab] = useState("variables")
  const [isDataViewerOpen, setIsDataViewerOpen] = useState(false)
  const { dataFile = null, dataLoaded = false, variables = [], addCustomVariable } = useData()

  const handleCustomVariableCreated = (customVar: CustomVariable) => {
    addCustomVariable({
      ...customVar,
      id: Date.now(),
      type: 'custom',
    });
  };

  if (!skipUploadCheck && !dataFile && !dataLoaded) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" size="sm" className="mr-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload a File to Begin</CardTitle>
            <CardDescription>You need to upload an SPSS file to start your analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex w-full min-h-screen">
      <aside className="w-[280px] bg-background border-r flex-shrink-0">
        <Card className="w-full h-full rounded-none border-0">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Workspace</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              <Button
                variant={activeTab === "variables" ? "default" : "ghost"}
                className="w-full justify-start rounded-none h-12 px-4"
                onClick={() => setActiveTab("variables")}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Variables
              </Button>
              <Button
                variant={activeTab === "crosstab" ? "default" : "ghost"}
                className="w-full justify-start rounded-none h-12 px-4"
                onClick={() => setActiveTab("crosstab")}
              >
                <Table2 className="h-4 w-4 mr-2" />
                Cross-tabulation
              </Button>
              <Button
                variant={activeTab === "results" ? "default" : "ghost"}
                className="w-full justify-start rounded-none h-12 px-4"
                onClick={() => setActiveTab("results")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Results
              </Button>
              <Button
                variant={activeTab === "assistant" ? "default" : "ghost"}
                className="w-full justify-start rounded-none h-12 px-4"
                onClick={() => setActiveTab("assistant")}
              >
                <Bot className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
      <main className="flex-1 flex flex-col p-8 gap-8 bg-background overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Analysis Workspace</h1>
            <p className="text-muted-foreground">{dataFile?.name || "Your SPSS data file"}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Change File
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsDataViewerOpen(true)}
            >
              <Table2 className="h-4 w-4 mr-2" />
              View Data
            </Button>
          </div>
        </div>
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="variables" className="m-0 w-full">
              <CustomVariableBuilder onVariableCreated={handleCustomVariableCreated} />
              <VariableSelector />
            </TabsContent>
            <TabsContent value="crosstab" className="m-0 w-full">
              <CrosstabBuilder setActiveTab={setActiveTab} />
            </TabsContent>
            <TabsContent value="results" className="m-0 w-full">
              <ResultsViewer />
            </TabsContent>
            <TabsContent value="assistant" className="m-0 w-full">
              <AIAgentChat />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <DataViewer 
        isOpen={isDataViewerOpen} 
        onOpenChange={setIsDataViewerOpen} 
      />
    </div>
  )
}
