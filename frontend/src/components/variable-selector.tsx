"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VariableInfoDialog } from "@/components/variable-info-dialog"
import { useData, Variable } from "@/contexts/data-context"

export function VariableSelector() {
  const { variables } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string[]>([])
  const [selectedVariables, setSelectedVariables] = useState<string[]>([])
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [currentVariable, setCurrentVariable] = useState<Variable | null>(null)

  // Debug logs
  console.log("All variables from context:", variables)

  const variableTypes = ["numeric", "categorical", "ordinal"]

  // Ensure type filter is case-insensitive and type values are lowercase
  const filteredVariables = variables.filter((variable) => {
    const name = variable.name?.toLowerCase() || ""
    const label = variable.label?.toLowerCase() || ""
    const type = variable.type?.toLowerCase() || ""
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      label.includes(searchQuery.toLowerCase())
    const matchesType =
      selectedType.length === 0 || selectedType.map(t => t.toLowerCase()).includes(type)
    return matchesSearch && matchesType
  })

  console.log("Filtered variables:", filteredVariables)

  const toggleVariableSelection = (variableName: string) => {
    if (selectedVariables.includes(variableName)) {
      setSelectedVariables(selectedVariables.filter((v) => v !== variableName))
    } else {
      setSelectedVariables([...selectedVariables, variableName])
    }
  }

  const showVariableInfo = (variable: Variable) => {
    setCurrentVariable(variable)
    setInfoDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Data Variables</CardTitle>
          <CardDescription>Select variables for your analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search variables..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {variableTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedType.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (selectedType.includes(type)) {
                      setSelectedType(selectedType.filter((t) => t !== type))
                    } else {
                      setSelectedType([...selectedType, type])
                    }
                  }}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
              {selectedType.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedType([])}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {selectedVariables.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Selected Variables:</p>
              <div className="flex flex-wrap gap-2">
                {selectedVariables.map((varName) => {
                  const variable = variables.find((v) => v.name === varName)
                  return (
                    <Badge key={varName} variant="secondary" className="flex items-center gap-1">
                      {variable?.label || varName}
                      <button
                        className="ml-1 hover:bg-muted rounded-full"
                        onClick={() => toggleVariableSelection(varName)}
                      >
                        ×
                      </button>
                    </Badge>
                  )
                })}
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedVariables([])}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 p-3 border-b bg-muted/50 text-sm font-medium">
              <div className="col-span-1"></div>
              <div className="col-span-3">Name</div>
              <div className="col-span-5">Label</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1"></div>
            </div>
            <ScrollArea className="h-[400px]">
              {filteredVariables.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No variables match your search</div>
              ) : (
                filteredVariables.map((variable) => (
                  <div
                    key={variable.id}
                    className="grid grid-cols-12 gap-2 p-3 border-b last:border-0 hover:bg-muted/50 items-center text-sm"
                  >
                    <div className="col-span-1">
                      <Checkbox
                        checked={selectedVariables.includes(variable.name)}
                        onCheckedChange={() => toggleVariableSelection(variable.name)}
                        id={`var-${variable.id}`}
                      />
                    </div>
                    <div className="col-span-3 font-medium">{variable.name}</div>
                    <div className="col-span-5 truncate">{variable.label || '-'}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="capitalize">
                        {variable.type}
                      </Badge>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => showVariableInfo(variable)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View variable details</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          <div className="mt-4 flex justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredVariables.length} of {variables.length} variables
            </p>
            <Button
              variant="default"
              disabled={selectedVariables.length === 0}
              onClick={() => {
                /* Proceed to next step */
              }}
            >
              Continue to Analysis
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentVariable && (
        <VariableInfoDialog variable={currentVariable} open={infoDialogOpen} onOpenChange={setInfoDialogOpen} />
      )}
    </div>
  )
}
