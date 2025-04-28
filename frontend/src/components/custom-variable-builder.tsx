import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/contexts/data-context"
import { Plus, X, HelpCircle, BookOpen } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface CustomVariableBuilderProps {
  onVariableCreated: (variable: CustomVariable) => void;
}

export interface CustomVariable {
  name: string;
  label: string;
  conditions: Condition[];
}

interface Condition {
  id: string;
  operator: 'AND' | 'OR';
  column: string;
  value: string;
  comparison: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

export function CustomVariableBuilder({ onVariableCreated }: CustomVariableBuilderProps) {
  const { variables, data } = useData()
  const [name, setName] = useState("")
  const [label, setLabel] = useState("")
  const [conditions, setConditions] = useState<Condition[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: Math.random().toString(36).substr(2, 9),
        operator: conditions.length === 0 ? 'AND' : 'AND',
        column: "",
        value: "",
        comparison: "equals"
      }
    ])
  }

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(cond => cond.id !== id))
  }

  const updateCondition = (id: string, field: keyof Condition, value: any) => {
    setConditions(conditions.map(cond => 
      cond.id === id ? { ...cond, [field]: value } : cond
    ))
  }

  const handleSubmit = () => {
    if (!name || !label || conditions.length === 0) return

    const newVariable: CustomVariable = {
      name,
      label,
      conditions
    }

    onVariableCreated(newVariable)
    setName("")
    setLabel("")
    setConditions([])
  }

  const getVariableType = (columnName: string) => {
    const variable = variables.find(v => v.name === columnName)
    return variable?.type || 'unknown'
  }

  // Helper to get unique values for a column
  const getColumnValues = (columnName: string): string[] => {
    if (!columnName || !data) return [];
    const uniqueValues = Array.from(new Set(data.map((row: Record<string, any>) => String(row[columnName])))) as string[];
    return uniqueValues.sort();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create Custom Variable</CardTitle>
            <CardDescription>Combine values from multiple columns to create new variables</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <BookOpen className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>How to Create Custom Variables</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Example: High Income Males</h3>
                  <p className="text-sm text-muted-foreground mb-2">To create a variable for high-income males:</p>
                  <ol className="list-decimal pl-4 space-y-2 text-sm">
                    <li>Enter variable name: <code>high_income_males</code></li>
                    <li>Enter variable label: <code>High Income Males</code></li>
                    <li>Add first condition:
                      <ul className="list-disc pl-4 mt-1">
                        <li>Select column: <code>Gender</code></li>
                        <li>Select comparison: <code>equals</code></li>
                        <li>Select value: <code>Male</code></li>
                      </ul>
                    </li>
                    <li>Click "Add Condition"</li>
                    <li>Add second condition:
                      <ul className="list-disc pl-4 mt-1">
                        <li>Select operator: <code>AND</code></li>
                        <li>Select column: <code>Income</code></li>
                        <li>Select comparison: <code>greater than</code></li>
                        <li>Enter value: <code>50000</code></li>
                      </ul>
                    </li>
                    <li>Click "Create Variable"</li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Example Variables</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Simple Example:</h4>
                      <p className="text-sm text-muted-foreground">Gender = 'Male' AND Age &gt; 30</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Complex Example:</h4>
                      <p className="text-sm text-muted-foreground">(Education = 'College' OR Education = 'Graduate') AND (Income &gt; 50000 OR Job_Satisfaction &gt; 7)</p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="variable-name">Variable Name</Label>
          <Input
            id="variable-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., high_income_educated_males"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="variable-label">Variable Label</Label>
          <Input
            id="variable-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., High Income Educated Males"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Conditions</Label>
            <Button variant="outline" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>

          {conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2 p-2 border rounded-md">
              {index > 0 && (
                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select
                value={condition.column}
                onValueChange={(value) => updateCondition(condition.id, 'column', value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {variables.map((variable) => (
                    <SelectItem key={variable.name} value={variable.name}>
                      {variable.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={condition.comparison}
                onValueChange={(value) => updateCondition(condition.id, 'comparison', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">equals</SelectItem>
                  <SelectItem value="contains">contains</SelectItem>
                  <SelectItem value="greater_than">greater than</SelectItem>
                  <SelectItem value="less_than">less than</SelectItem>
                </SelectContent>
              </Select>

              {condition.column && getColumnValues(condition.column).length > 0 ? (
                <Select
                  value={condition.value}
                  onValueChange={(value) => updateCondition(condition.id, 'value', value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    {getColumnValues(condition.column).map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="w-[200px]"
                  value={condition.value}
                  onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                  placeholder="Enter value"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCondition(condition.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={!name || !label || conditions.length === 0}
        >
          Create Variable
        </Button>
      </CardContent>
    </Card>
  )
} 