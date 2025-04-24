"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, Download, FileSpreadsheet, PieChart, Share2, Table2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ResultsViewer() {
  const [viewMode, setViewMode] = useState<"table" | "bar" | "pie">("table")

  // Mock data for results
  const hasResults = true

  if (!hasResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>Run an analysis to see results here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center justify-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Configure your cross-tabulation settings and run an analysis to see results here.
            </p>
            <Button className="mt-4">Go to Analysis</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>Gender by Age Group Cross-tabulation</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">
                    <div className="flex items-center">
                      <Table2 className="h-4 w-4 mr-2" />
                      Table
                    </div>
                  </SelectItem>
                  <SelectItem value="bar">
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center">
                      <PieChart className="h-4 w-4 mr-2" />
                      Pie Chart
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" && (
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border p-2 text-left" rowSpan={2}>
                        Age Group
                      </th>
                      <th className="border p-2 text-center" colSpan={3}>
                        Gender
                      </th>
                      <th className="border p-2 text-center" rowSpan={2}>
                        Total
                      </th>
                    </tr>
                    <tr className="bg-muted/50">
                      <th className="border p-2 text-center">Male</th>
                      <th className="border p-2 text-center">Female</th>
                      <th className="border p-2 text-center">Other</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium">18-24</td>
                      <td className="border p-2 text-center">
                        <div>42</div>
                        <div className="text-xs text-muted-foreground">32.3%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>56</div>
                        <div className="text-xs text-muted-foreground">43.1%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>8</div>
                        <div className="text-xs text-muted-foreground">6.2%</div>
                      </td>
                      <td className="border p-2 text-center font-medium">
                        <div>106</div>
                        <div className="text-xs text-muted-foreground">26.5%</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">25-34</td>
                      <td className="border p-2 text-center">
                        <div>78</div>
                        <div className="text-xs text-muted-foreground">39.0%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>82</div>
                        <div className="text-xs text-muted-foreground">41.0%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>4</div>
                        <div className="text-xs text-muted-foreground">2.0%</div>
                      </td>
                      <td className="border p-2 text-center font-medium">
                        <div>164</div>
                        <div className="text-xs text-muted-foreground">41.0%</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">35-44</td>
                      <td className="border p-2 text-center">
                        <div>45</div>
                        <div className="text-xs text-muted-foreground">45.0%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>52</div>
                        <div className="text-xs text-muted-foreground">52.0%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>3</div>
                        <div className="text-xs text-muted-foreground">3.0%</div>
                      </td>
                      <td className="border p-2 text-center font-medium">
                        <div>100</div>
                        <div className="text-xs text-muted-foreground">25.0%</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-2 font-medium">45-54</td>
                      <td className="border p-2 text-center">
                        <div>12</div>
                        <div className="text-xs text-muted-foreground">40.0%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>18</div>
                        <div className="text-xs text-muted-foreground">60.0%</div>
                      </td>
                      <td className="border p-2 text-center">
                        <div>0</div>
                        <div className="text-xs text-muted-foreground">0.0%</div>
                      </td>
                      <td className="border p-2 text-center font-medium">
                        <div>30</div>
                        <div className="text-xs text-muted-foreground">7.5%</div>
                      </td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="border p-2 font-medium">Total</td>
                      <td className="border p-2 text-center font-medium">
                        <div>177</div>
                        <div className="text-xs text-muted-foreground">44.3%</div>
                      </td>
                      <td className="border p-2 text-center font-medium">
                        <div>208</div>
                        <div className="text-xs text-muted-foreground">52.0%</div>
                      </td>
                      <td className="border p-2 text-center font-medium">
                        <div>15</div>
                        <div className="text-xs text-muted-foreground">3.8%</div>
                      </td>
                      <td className="border p-2 text-center font-medium">
                        <div>400</div>
                        <div className="text-xs text-muted-foreground">100.0%</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium mb-2">Chi-Square Tests</h4>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border p-2 text-left">Test</th>
                        <th className="border p-2 text-center">Value</th>
                        <th className="border p-2 text-center">df</th>
                        <th className="border p-2 text-center">p-value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">Pearson Chi-Square</td>
                        <td className="border p-2 text-center">12.487</td>
                        <td className="border p-2 text-center">6</td>
                        <td className="border p-2 text-center">0.052</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Likelihood Ratio</td>
                        <td className="border p-2 text-center">13.842</td>
                        <td className="border p-2 text-center">6</td>
                        <td className="border p-2 text-center">0.031</td>
                      </tr>
                      <tr>
                        <td className="border p-2">N of Valid Cases</td>
                        <td className="border p-2 text-center">400</td>
                        <td className="border p-2 text-center"></td>
                        <td className="border p-2 text-center"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollArea>
          )}

          {viewMode === "bar" && (
            <div className="h-[400px] border rounded-md p-4 flex items-center justify-center">
              <div className="w-full max-w-2xl">
                <div className="text-center mb-4">
                  <h3 className="font-medium">Age Group by Gender</h3>
                </div>
                <div className="h-[300px] flex items-end gap-8 justify-center">
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2">18-24</div>
                    <div className="flex gap-2 h-[250px] items-end">
                      <div className="w-12 bg-blue-500 h-[32%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">32%</div>
                      </div>
                      <div className="w-12 bg-pink-500 h-[43%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">43%</div>
                      </div>
                      <div className="w-12 bg-purple-500 h-[6%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">6%</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2">25-34</div>
                    <div className="flex gap-2 h-[250px] items-end">
                      <div className="w-12 bg-blue-500 h-[39%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">39%</div>
                      </div>
                      <div className="w-12 bg-pink-500 h-[41%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">41%</div>
                      </div>
                      <div className="w-12 bg-purple-500 h-[2%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">2%</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2">35-44</div>
                    <div className="flex gap-2 h-[250px] items-end">
                      <div className="w-12 bg-blue-500 h-[45%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">45%</div>
                      </div>
                      <div className="w-12 bg-pink-500 h-[52%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">52%</div>
                      </div>
                      <div className="w-12 bg-purple-500 h-[3%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">3%</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs mb-2">45-54</div>
                    <div className="flex gap-2 h-[250px] items-end">
                      <div className="w-12 bg-blue-500 h-[40%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">40%</div>
                      </div>
                      <div className="w-12 bg-pink-500 h-[60%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">60%</div>
                      </div>
                      <div className="w-12 bg-purple-500 h-[0%] flex flex-col justify-end">
                        <div className="text-xs text-center text-white p-1">0%</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500"></div>
                      <span className="text-xs">Male</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-pink-500"></div>
                      <span className="text-xs">Female</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500"></div>
                      <span className="text-xs">Other</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === "pie" && (
            <div className="h-[400px] border rounded-md p-4 flex items-center justify-center">
              <div className="w-full max-w-2xl">
                <div className="text-center mb-4">
                  <h3 className="font-medium">Gender Distribution</h3>
                </div>
                <div className="flex justify-center">
                  <div className="relative w-64 h-64">
                    {/* This is a simplified pie chart representation */}
                    <div
                      className="absolute inset-0 rounded-full border-8 border-blue-500"
                      style={{
                        clipPath: "polygon(50% 50%, 0 0, 0 50%, 0 100%, 50% 100%, 100% 100%, 100% 50%, 100% 0, 50% 0)",
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full border-8 border-pink-500"
                      style={{
                        clipPath: "polygon(50% 50%, 100% 0, 50% 0, 0 0, 0 50%, 0 100%, 50% 100%, 100% 100%, 100% 50%)",
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 rounded-full border-8 border-purple-500"
                      style={{ clipPath: "polygon(50% 50%, 100% 50%, 100% 0, 95% 0, 90% 0, 85% 0, 80% 0)" }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-center mt-8">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold">44.3%</div>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="w-3 h-3 bg-blue-500"></div>
                        <span className="text-sm">Male</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">52.0%</div>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="w-3 h-3 bg-pink-500"></div>
                        <span className="text-sm">Female</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">3.8%</div>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="w-3 h-3 bg-purple-500"></div>
                        <span className="text-sm">Other</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button variant="default">
            <BarChart3 className="h-4 w-4 mr-2" />
            More Visualizations
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
