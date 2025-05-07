"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface VariableInfoDialogProps {
  variable: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface NumericFrequencyData {
  min: number
  max: number
  mean: number
  median: number
  stdDev: number
  missing: number
}

interface CategoricalFrequencyData {
  value: string
  originalValue: string
  count: number
  percentage: string
}

type FrequencyData = NumericFrequencyData | CategoricalFrequencyData[]

export function VariableInfoDialog({ variable, open, onOpenChange }: VariableInfoDialogProps) {
  // Get frequency data for categorical/ordinal variables
  const getFrequencyData = (): FrequencyData => {
    if (variable.type === "numeric") {
      return {
        min: 18,
        max: 85,
        mean: 42.5,
        median: 41,
        stdDev: 15.2,
        missing: variable.missing_values?.length || 0,
      }
    } else {
      // Use actual value labels if available
      const valueLabels = variable.value_labels || {}
      return Object.entries(valueLabels).map(([value, label]) => ({
        value: label as string,
        originalValue: value,
        count: Math.floor(Math.random() * 100) + 1, // TODO: Replace with actual counts
        percentage: (Math.random() * 100).toFixed(1), // TODO: Replace with actual percentages
      }))
    }
  }

  const frequencyData = getFrequencyData()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{variable.label}</DialogTitle>
          <DialogDescription>Variable details and distribution</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Variable Name:</div>
            <div>{variable.name}</div>

            <div className="font-medium">Type:</div>
            <div>
              <Badge variant="outline" className="capitalize">
                {variable.type}
              </Badge>
            </div>

            <div className="font-medium">Label:</div>
            <div>{variable.label || '-'}</div>

            {variable.value_labels && Object.keys(variable.value_labels).length > 0 && (
              <>
                <div className="font-medium">Value Labels:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(variable.value_labels).map(([value, label]) => (
                    <Badge key={value} variant="secondary">
                      {value}: {String(label)}
                    </Badge>
                  ))}
                </div>
              </>
            )}

            {variable.missing_values && variable.missing_values.length > 0 && (
              <>
                <div className="font-medium">Missing Values:</div>
                <div className="flex flex-wrap gap-1">
                  {variable.missing_values.map((value: any, index: number) => (
                    <Badge key={index} variant="destructive">
                      {String(value)}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Distribution:</h4>
            {variable.type === "numeric" ? (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>Minimum:</div>
                  <div>{(frequencyData as NumericFrequencyData).min}</div>

                  <div>Maximum:</div>
                  <div>{(frequencyData as NumericFrequencyData).max}</div>

                  <div>Mean:</div>
                  <div>{(frequencyData as NumericFrequencyData).mean}</div>

                  <div>Median:</div>
                  <div>{(frequencyData as NumericFrequencyData).median}</div>

                  <div>Standard Deviation:</div>
                  <div>{(frequencyData as NumericFrequencyData).stdDev}</div>

                  <div>Missing Values:</div>
                  <div>{(frequencyData as NumericFrequencyData).missing}</div>
                </div>

                {/* Simple histogram visualization */}
                <div className="mt-4 pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Histogram:</h4>
                  <div className="h-24 flex items-end gap-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const height = Math.floor(Math.random() * 80) + 20
                      return <div key={i} className="bg-primary/80 w-full rounded-t" style={{ height: `${height}%` }} />
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{(frequencyData as NumericFrequencyData).min}</span>
                    <span>{(frequencyData as NumericFrequencyData).max}</span>
                  </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Value</th>
                      <th className="text-right p-2">Count</th>
                      <th className="text-right p-2">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(frequencyData as CategoricalFrequencyData[]).map((item, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-2">{item.value}</td>
                        <td className="text-right p-2">{item.count}</td>
                        <td className="text-right p-2">{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
