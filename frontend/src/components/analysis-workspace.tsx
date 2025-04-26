"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { VariableSelector } from "@/components/variable-selector"
import { CrosstabBuilder } from "@/components/crosstab-builder"
import { ResultsViewer } from "@/components/results-viewer"
import { ChatAssistant } from "@/components/chat-assistant"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useData } from "@/lib/data-context"
import { FileUploader } from "@/components/file-uploader"
import { ArrowLeft, Bot, BarChart3, Table2, FileSpreadsheet } from "lucide-react"
import Link from "next/link"

export function AnalysisWorkspace({ skipUploadCheck = false }: { skipUploadCheck?: boolean }) {
  const [activeTab, setActiveTab] = useState("variables")
  const { dataFile = null, dataLoaded = false, variables = [] } = useData()

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
    <div className="space-y-6">
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
          <Button variant="default" size="sm">
            <Bot className="h-4 w-4 mr-2" />
            Ask AI Assistant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
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

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="variables" className="m-0">
              <VariableSelector />
            </TabsContent>
            <TabsContent value="crosstab" className="m-0">
              <CrosstabBuilder />
            </TabsContent>
            <TabsContent value="results" className="m-0">
              <ResultsViewer />
            </TabsContent>
            <TabsContent value="assistant" className="m-0">
              <ChatAssistant />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
