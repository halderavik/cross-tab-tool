"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { GripVertical, Plus, X, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useData } from "@/contexts/data-context"
import axios from "axios"

// Add API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface CrosstabBuilderProps {
  setActiveTab?: (tab: string) => void;
}

interface CustomVariable {
  name: string;
  label: string;
  conditions: {
    id: string;
    operator: 'AND' | 'OR';
    column: string;
    value: string;
    comparison: 'equals' | 'contains' | 'greater_than' | 'less_than';
  }[];
}

export function CrosstabBuilder({ setActiveTab }: CrosstabBuilderProps) {
  const [rowVariables, setRowVariables] = useState<string[]>([])
  const [columnVariables, setColumnVariables] = useState<string[]>([])
  const [bannerVariables, setBannerVariables] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState("basic")
  const { dataFile, setData, isLoading, setIsLoading, error, setError } = useData()
  const [chiSquare, setChiSquare] = useState(false)
  const [phiCramer, setPhiCramer] = useState(false)
  const [contingency, setContingency] = useState(false)
  const [rowPct, setRowPct] = useState(true)
  const [colPct, setColPct] = useState(true)
  const [totalPct, setTotalPct] = useState(false)
  const [decimalPlaces, setDecimalPlaces] = useState(1)
  const [missing, setMissing] = useState("exclude")
  const [hideEmpty, setHideEmpty] = useState(false)
  const [enableSig, setEnableSig] = useState(false)
  const [sigLevel, setSigLevel] = useState(0.05)
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([])
  const [weightVar, setWeightVar] = useState<string | null>(null)
  const [subgroupVar, setSubgroupVar] = useState<string | null>(null)
  const [subgroupValues, setSubgroupValues] = useState<string[]>([])
  const [availableSubgroupValues, setAvailableSubgroupValues] = useState<string[]>([])

  // Use variables from context
  const { variables, sampleData } = useData()

  // Update available subgroup values when subgroupVar changes
  useEffect(() => {
    if (subgroupVar && sampleData) {
      const uniqueVals = Array.from(new Set(sampleData.data.map((row: any) => String(row[subgroupVar])))).sort();
      setAvailableSubgroupValues(uniqueVals)
    } else {
      setAvailableSubgroupValues([])
    }
    setSubgroupValues([])
  }, [subgroupVar, sampleData])

  const addRowVariable = (variable: string) => {
    if (!rowVariables.includes(variable)) {
      setRowVariables([...rowVariables, variable])
    }
  }

  const addColumnVariable = (variable: string) => {
    if (!columnVariables.includes(variable)) {
      setColumnVariables([...columnVariables, variable])
    }
  }

  const addBannerVariable = (variable: string) => {
    if (!bannerVariables.includes(variable)) {
      setBannerVariables([...bannerVariables, variable])
    }
  }

  const removeRowVariable = (variable: string) => {
    setRowVariables(rowVariables.filter((v) => v !== variable))
  }

  const removeColumnVariable = (variable: string) => {
    setColumnVariables(columnVariables.filter((v) => v !== variable))
  }

  const removeBannerVariable = (variable: string) => {
    setBannerVariables(bannerVariables.filter((v) => v !== variable))
  }

  const getVariableLabel = (name: string) => {
    if (!name || !variables || !Array.isArray(variables)) return name
    const variable = variables.find((v) => v && v.name === name)
    return variable && variable.label ? variable.label : name
  }

  const canRunAnalysis = rowVariables.length > 0 && (columnVariables.length > 0 || bannerVariables.length > 0)

  const handleCustomVariableCreated = (variable: CustomVariable) => {
    setCustomVariables([...customVariables, variable])
  }

  const handleRunAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (!dataFile?.filePath) {
        throw new Error("No data file selected. Please upload a file first.")
      }

      // Ensure the file path is properly formatted
      const filePath = dataFile.filePath.replace(/\\/g, '/')
      
      const subgroup = subgroupVar && subgroupValues.length > 0 ? { [subgroupVar]: subgroupValues.length === 1 ? subgroupValues[0] : subgroupValues } : undefined;
      const payload = {
        file_path: filePath,
        row_vars: rowVariables,
        col_vars: columnVariables,
        statistics: [chiSquare && "chi-square", phiCramer && "phi-cramer", contingency && "contingency"].filter(Boolean),
        display: { row_pct: rowPct, col_pct: colPct, total_pct: totalPct },
        significance: { enable: enableSig, level: sigLevel },
        decimal_places: decimalPlaces,
        missing,
        hide_empty: hideEmpty,
        custom_variables: customVariables,
        weight_var: weightVar || undefined,
        subgroup: subgroup
      }

      // Use the configured API instance
      const res = await api.post("/api/analyze-crosstab", payload)
      
      if (!res.data) {
        throw new Error("No data received from the server")
      }

      setData({ ...res.data, row_vars: rowVariables, col_vars: columnVariables })
      if (setActiveTab) setActiveTab("results")
    } catch (err: any) {
      console.error("Analysis error:", err)
      let errorMessage = "Analysis failed"
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = err.response.data?.detail || err.response.data?.message || `Server error: ${err.response.status}`
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check if the backend is running."
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Show a more user-friendly error message for specific cases
      if (errorMessage.includes("codec can't decode")) {
        setError("Unable to read the SPSS file. Please ensure the file is not corrupted and try again.")
      } else if (errorMessage.includes("ECONNREFUSED")) {
        setError("Cannot connect to the server. Please ensure the backend is running.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Cross-tabulation</TabsTrigger>
          <TabsTrigger value="banner">Banner Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Row Variables</CardTitle>
                <CardDescription>Select variables to display as rows</CardDescription>
              </CardHeader>
              <CardContent>
                {rowVariables.length === 0 ? (
                  <div className="border border-dashed rounded-md p-4 text-center text-muted-foreground">
                    No row variables selected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rowVariables.map((variable, index) => (
                      <div
                        key={variable}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <span>{getVariableLabel(variable)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeRowVariable(variable)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row Variable
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <ScrollArea className="h-[200px]">
                      {variables.map((variable) => (
                        <button
                          key={variable.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            addRowVariable(variable.name)
                          }}
                        >
                          {variable.label}
                        </button>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Column Variables</CardTitle>
                <CardDescription>Select variables to display as columns</CardDescription>
              </CardHeader>
              <CardContent>
                {columnVariables.length === 0 ? (
                  <div className="border border-dashed rounded-md p-4 text-center text-muted-foreground">
                    No column variables selected
                  </div>
                ) : (
                  <div className="space-y-2">
                    {columnVariables.map((variable, index) => (
                      <div
                        key={variable}
                        className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <span>{getVariableLabel(variable)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeColumnVariable(variable)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Column Variable
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <ScrollArea className="h-[200px]">
                      {variables.map((variable) => (
                        <button
                          key={variable.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            addColumnVariable(variable.name)
                          }}
                        >
                          {variable.label}
                        </button>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Options</CardTitle>
              <CardDescription>Weighting and Subgroup Analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight variable selection */}
                <div>
                  <Label htmlFor="weight-var">Weight Variable</Label>
                  <Select value={weightVar ?? "__none__"} onValueChange={(val: string) => setWeightVar(val === "__none__" ? null : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weight variable (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {variables.filter(v => v.type === "numeric").map(v => (
                        <SelectItem key={v.name} value={v.name}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Subgroup selection */}
                <div>
                  <Label htmlFor="subgroup-var">Subgroup Variable</Label>
                  <Select value={subgroupVar ?? "__none__"} onValueChange={(val: string) => setSubgroupVar(val === "__none__" ? null : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subgroup variable (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {variables.map(v => (
                        <SelectItem key={v.name} value={v.name}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subgroupVar && availableSubgroupValues.length > 0 && (
                    <div className="mt-2">
                      <Label>Select Subgroup Value(s)</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {availableSubgroupValues.map(val => (
                          <Button
                            key={val}
                            size="sm"
                            variant={subgroupValues.includes(val) ? "default" : "outline"}
                            onClick={() => {
                              setSubgroupValues(subgroupValues.includes(val)
                                ? subgroupValues.filter(v => v !== val)
                                : [...subgroupValues, val])
                            }}
                          >
                            {val}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Options</CardTitle>
              <CardDescription>Configure additional analysis settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="statistics">
                  <AccordionTrigger>Statistics</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="chi-square" checked={chiSquare} onCheckedChange={(checked: boolean) => setChiSquare(checked === true)} />
                          <Label htmlFor="chi-square">Chi-square</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="phi-cramer" checked={phiCramer} onCheckedChange={(checked: boolean) => setPhiCramer(checked === true)} />
                          <Label htmlFor="phi-cramer">Phi & Cramer's V</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="contingency" checked={contingency} onCheckedChange={(checked: boolean) => setContingency(checked === true)} />
                          <Label htmlFor="contingency">Contingency Coefficient</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="row-pct" checked={rowPct} onCheckedChange={(checked: boolean) => setRowPct(checked === true)} />
                          <Label htmlFor="row-pct">Row Percentages</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="col-pct" checked={colPct} onCheckedChange={(checked: boolean) => setColPct(checked === true)} />
                          <Label htmlFor="col-pct">Column Percentages</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="total-pct" checked={totalPct} onCheckedChange={(checked: boolean) => setTotalPct(checked === true)} />
                          <Label htmlFor="total-pct">Total Percentages</Label>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="display">
                  <AccordionTrigger>Display Options</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="decimal-places">Decimal Places</Label>
                          <Select value={decimalPlaces.toString()} onValueChange={(value: string) => setDecimalPlaces(Number(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select decimal places" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="missing-values">Missing Values</Label>
                          <Select value={missing} onValueChange={(value: string) => setMissing(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Handle missing values" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="exclude">Exclude</SelectItem>
                              <SelectItem value="include">Include</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="hide-empty" checked={hideEmpty} onCheckedChange={(checked: boolean) => setHideEmpty(checked === true)} />
                        <Label htmlFor="hide-empty">Hide Empty Rows/Columns</Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="significance">
                  <AccordionTrigger>Significance Testing</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="enable-sig" checked={enableSig} onCheckedChange={(checked: boolean) => setEnableSig(checked === true)} />
                        <Label htmlFor="enable-sig">Enable Significance Testing</Label>
                      </div>
                      <div>
                        <Label htmlFor="sig-level">Significance Level</Label>
                        <Select value={sigLevel.toString()} onValueChange={(value: string) => setSigLevel(Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select significance level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.1">0.1 (90%)</SelectItem>
                            <SelectItem value="0.05">0.05 (95%)</SelectItem>
                            <SelectItem value="0.01">0.01 (99%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset</Button>
              <Button
                disabled={!canRunAnalysis}
                onClick={handleRunAnalysis}
              >
                Run Analysis
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="banner" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Banner Variables</CardTitle>
                  <CardDescription>Select variables to display as banners</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Banner tables display multiple analyses in a single table. Each banner variable creates a section
                      of columns in the table.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              {bannerVariables.length === 0 ? (
                <div className="border border-dashed rounded-md p-4 text-center text-muted-foreground">
                  No banner variables selected
                </div>
              ) : (
                <div className="space-y-2">
                  {bannerVariables.map((variable, index) => (
                    <div key={variable} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span>{getVariableLabel(variable)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeBannerVariable(variable)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Banner Variable
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <ScrollArea className="h-[200px]">
                    {variables.map((variable) => (
                      <button
                        key={variable.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          addBannerVariable(variable.name)
                        }}
                      >
                        {variable.label}
                      </button>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Row Variables</CardTitle>
              <CardDescription>Select variables to display as rows</CardDescription>
            </CardHeader>
            <CardContent>
              {rowVariables.length === 0 ? (
                <div className="border border-dashed rounded-md p-4 text-center text-muted-foreground">
                  No row variables selected
                </div>
              ) : (
                <div className="space-y-2">
                  {rowVariables.map((variable, index) => (
                    <div key={variable} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span>{getVariableLabel(variable)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeRowVariable(variable)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row Variable
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <ScrollArea className="h-[200px]">
                    {variables.map((variable) => (
                      <button
                        key={variable.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          addRowVariable(variable.name)
                        }}
                      >
                        {variable.label}
                      </button>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Options</CardTitle>
              <CardDescription>Weighting and Subgroup Analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight variable selection */}
                <div>
                  <Label htmlFor="banner-weight-var">Weight Variable</Label>
                  <Select value={weightVar ?? "__none__"} onValueChange={(val: string) => setWeightVar(val === "__none__" ? null : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weight variable (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {variables.filter(v => v.type === "numeric").map(v => (
                        <SelectItem key={v.name} value={v.name}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Subgroup selection */}
                <div>
                  <Label htmlFor="banner-subgroup-var">Subgroup Variable</Label>
                  <Select value={subgroupVar ?? "__none__"} onValueChange={(val: string) => setSubgroupVar(val === "__none__" ? null : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subgroup variable (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {variables.map(v => (
                        <SelectItem key={v.name} value={v.name}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subgroupVar && availableSubgroupValues.length > 0 && (
                    <div className="mt-2">
                      <Label>Select Subgroup Value(s)</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {availableSubgroupValues.map(val => (
                          <Button
                            key={val}
                            size="sm"
                            variant={subgroupValues.includes(val) ? "default" : "outline"}
                            onClick={() => {
                              setSubgroupValues(subgroupValues.includes(val)
                                ? subgroupValues.filter(v => v !== val)
                                : [...subgroupValues, val])
                            }}
                          >
                            {val}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Banner Table Options</CardTitle>
              <CardDescription>Configure banner table settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="statistics">
                  <AccordionTrigger>Statistics</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="banner-counts" />
                          <Label htmlFor="banner-counts">Show Counts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="banner-col-pct" />
                          <Label htmlFor="banner-col-pct">Column Percentages</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="banner-sig" />
                          <Label htmlFor="banner-sig">Significance Testing</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="banner-mean" />
                          <Label htmlFor="banner-mean">Mean (for numeric)</Label>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="layout">
                  <AccordionTrigger>Layout Options</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="banner-layout">Banner Layout</Label>
                        <Select defaultValue="standard">
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="compact">Compact</SelectItem>
                            <SelectItem value="expanded">Expanded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="banner-hide-empty" />
                        <Label htmlFor="banner-hide-empty">Hide Empty Categories</Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset</Button>
              <Button
                disabled={rowVariables.length === 0 || bannerVariables.length === 0}
                onClick={() => {
                  /* Run analysis */
                }}
              >
                Run Banner Analysis
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
