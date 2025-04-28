"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, Download, FileSpreadsheet, PieChart, Share2, Table2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/contexts/data-context"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function ResultsViewer() {
  const [viewMode, setViewMode] = useState<"table" | "bar" | "pie">("table")
  const [tableTab, setTableTab] = useState("frequency")
  const { data, isLoading, error } = useData();
  const hasResults = !!data && data.table;

  // Get row/column variable names from the analysis result if available
  const rowVars = data?.row_vars || [];
  const colVars = data?.col_vars || [];

  // Helper to get the right table for the selected tab
  const getTable = () => {
    if (!data) return null;
    if (tableTab === "frequency") return data.table;
    if (tableTab === "row_pct") return data.percentages?.row_pct;
    if (tableTab === "col_pct") return data.percentages?.col_pct;
    if (tableTab === "total_pct") return data.percentages?.total_pct;
    return null;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Running analysis...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }
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

  // Table rendering logic
  const table = getTable() || {};
  const colKeys = Object.keys(table);
  const rowKeys = colKeys.length > 0 ? Object.keys(table[colKeys[0]] || {}) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                {rowVars.length && colVars.length
                  ? `${rowVars.join(', ')} by ${colVars.join(', ')} Cross-tabulation`
                  : "Cross-tabulation Results"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select 
                value={viewMode} 
                onValueChange={(value: string) => setViewMode(value as "table" | "bar" | "pie")}
              >
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
            <>
              <Tabs value={tableTab} onValueChange={setTableTab} className="mb-4">
                <TabsList>
                  <TabsTrigger value="frequency">Frequency</TabsTrigger>
                  {data.percentages?.row_pct && <TabsTrigger value="row_pct">Row %</TabsTrigger>}
                  {data.percentages?.col_pct && <TabsTrigger value="col_pct">Col %</TabsTrigger>}
                  {data.percentages?.total_pct && <TabsTrigger value="total_pct">Total %</TabsTrigger>}
                </TabsList>
              </Tabs>
              <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">{rowVars.join(' / ')}</th>
                        {colKeys.map((col) => (
                          <th key={col} className="border p-2 text-center">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rowKeys.map((rowKey) => (
                        <tr key={rowKey}>
                          <td className="border p-2 text-left font-medium">{rowKey}</td>
                          {colKeys.map((colKey) => (
                            <td key={colKey} className="border p-2 text-center">{table[colKey][rowKey] ?? 0}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
              {/* Render stats if present */}
              {data.stats && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium mb-2">Statistics</h4>
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
                      {data.stats.chi_square && (
                        <tr>
                          <td className="border p-2">Pearson Chi-Square</td>
                          <td className="border p-2 text-center">{data.stats.chi_square.chi2?.toFixed(3)}</td>
                          <td className="border p-2 text-center">{data.stats.chi_square.dof}</td>
                          <td className="border p-2 text-center">{data.stats.chi_square.p?.toFixed(3)}</td>
                        </tr>
                      )}
                      {data.stats.phi && (
                        <tr>
                          <td className="border p-2">Phi</td>
                          <td className="border p-2 text-center">{data.stats.phi?.toFixed(3)}</td>
                          <td className="border p-2 text-center">-</td>
                          <td className="border p-2 text-center">-</td>
                        </tr>
                      )}
                      {data.stats.cramers_v && (
                        <tr>
                          <td className="border p-2">Cramér's V</td>
                          <td className="border p-2 text-center">{data.stats.cramers_v?.toFixed(3)}</td>
                          <td className="border p-2 text-center">-</td>
                          <td className="border p-2 text-center">-</td>
                        </tr>
                      )}
                      {data.stats.contingency_coefficient && (
                        <tr>
                          <td className="border p-2">Contingency Coefficient</td>
                          <td className="border p-2 text-center">{data.stats.contingency_coefficient?.toFixed(3)}</td>
                          <td className="border p-2 text-center">-</td>
                          <td className="border p-2 text-center">-</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
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
