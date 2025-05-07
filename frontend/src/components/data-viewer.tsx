"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useData } from "@/contexts/data-context"
import { Maximize2, Minimize2, Table2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface DataViewerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataViewer({ isOpen, onOpenChange }: DataViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState("data")
  const [fullData, setFullData] = useState<any[] | null>(null)
  const [isLoadingFull, setIsLoadingFull] = useState(false)
  const { dataFile, sampleData, fileType, variables } = useData()

  if (!dataFile || !sampleData) {
    return null
  }

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Set scrollable area size
  const tableContainerClass = isFullscreen
    ? "w-[98vw] h-[85vh] overflow-x-auto overflow-y-auto"
    : "w-full max-w-4xl h-[400px] overflow-x-auto overflow-y-auto"

  // Load full data from backend
  const handleLoadFullData = async () => {
    setIsLoadingFull(true)
    try {
      let url = ""
      if (dataFile.name?.toLowerCase().endsWith(".csv")) {
        url = `/api/csv-full/${dataFile.name}`
      } else if (dataFile.name?.toLowerCase().endsWith(".sav")) {
        url = `/api/spss-full/${dataFile.name}`
      }
      if (!url) throw new Error("Unknown file type")
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to load full data")
      const data = await res.json()
      setFullData(data.data)
    } catch (err) {
      alert("Failed to load full data: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsLoadingFull(false)
    }
  }

  // Use fullData if loaded, otherwise sampleData
  const rowsToShow = fullData || sampleData.data

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent 
          className={`${isFullscreen ? 'max-w-[100vw] max-h-[100vh] p-2' : 'max-w-4xl max-h-[80vh]'} fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50 bg-background`}
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Data Viewer - {dataFile.name}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreenToggle}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div id="dialog-description" className="sr-only">
            View and analyze your data file contents and metadata
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="meta">Metadata</TabsTrigger>
            </TabsList>
            <TabsContent value="data">
              <div className="rounded-md border bg-background">
                <div className="flex items-center justify-between p-2">
                  <span className="text-xs text-muted-foreground">Rows: {rowsToShow.length}</span>
                  <Button size="sm" variant="outline" onClick={handleLoadFullData} disabled={isLoadingFull || !!fullData}>
                    {isLoadingFull ? "Loading..." : fullData ? "Full Data Loaded" : "Load Full Data"}
                  </Button>
                </div>
                <div className={tableContainerClass}>
                  <table className="min-w-max w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {sampleData.columns.map((column) => (
                          <th key={column} className="px-2 py-1 border-b bg-muted sticky top-0 z-10">{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rowsToShow.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {sampleData.columns.map((column) => (
                            <td key={`${rowIndex}-${column}`} className="px-2 py-1 border-b">{row[column]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="meta">
              <div className="rounded-md border bg-background">
                <div className={isFullscreen ? "h-[85vh] overflow-y-auto" : "h-[400px] overflow-y-auto"}>
                  <table className="min-w-max w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 border-b bg-muted sticky top-0 z-10">Name</th>
                        <th className="px-2 py-1 border-b bg-muted sticky top-0 z-10">Label</th>
                        <th className="px-2 py-1 border-b bg-muted sticky top-0 z-10">Type</th>
                        <th className="px-2 py-1 border-b bg-muted sticky top-0 z-10">Value Labels</th>
                        <th className="px-2 py-1 border-b bg-muted sticky top-0 z-10">Missing Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variables.map((variable) => (
                        <tr key={variable.id}>
                          <td className="px-2 py-1 border-b font-medium">{variable.name}</td>
                          <td className="px-2 py-1 border-b">{variable.label || '-'}</td>
                          <td className="px-2 py-1 border-b">
                            <Badge variant="outline" className="capitalize">
                              {variable.type}
                            </Badge>
                          </td>
                          <td className="px-2 py-1 border-b">
                            {variable.value_labels && Object.keys(variable.value_labels).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(variable.value_labels).map(([value, label]) => (
                                  <Badge key={value} variant="secondary" className="text-xs">
                                    {value}: {String(label)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-2 py-1 border-b">
                            {variable.missing_values && variable.missing_values.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {variable.missing_values.map((value: string | number, index: number) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {String(value)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
} 