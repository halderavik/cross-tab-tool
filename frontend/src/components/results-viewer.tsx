"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, Download, FileSpreadsheet, PieChart, Share2, Table2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useData } from "@/contexts/data-context"

export function ResultsViewer() {
  const [viewMode, setViewMode] = useState<"table" | "bar" | "pie">("table")
  const { data } = useData();
  const hasResults = !!data && data.table;

  // Get row/column variable names from the analysis result if available
  const rowVars = data?.row_vars || [];
  const colVars = data?.col_vars || [];

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
              <CardDescription>
                {rowVars.length && colVars.length
                  ? `${rowVars.join(', ')} by ${colVars.join(', ')} Cross-tabulation`
                  : "Cross-tabulation Results"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select 
                value={viewMode} 
                onValueChange={(value) => setViewMode(value as "table" | "bar" | "pie")}
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
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4">
                <table className="w-full border-collapse">
                  <thead>
                    {/* Dynamically render multi-level column headers */}
                    {(() => {
                      const table = data.table || {};
                      const colKeys = Object.keys(table);
                      if (colKeys.length === 0) return null;
                      // Get all unique column multi-index levels
                      const colLevels = colKeys.map(k => {
                        if (typeof k === 'string' && k.startsWith('(') && k.endsWith(')')) {
                          // Remove parentheses and split by comma, trim spaces, handle 'nan'
                          return k.slice(1, -1).split(',').map(s => s.trim());
                        }
                        return [k];
                      });
                      const maxColDepth = Math.max(...colLevels.map(l => Array.isArray(l) ? l.length : 1));
                      // Build header rows
                      let headerRows: any[] = [];
                      for (let level = 0; level < maxColDepth; level++) {
                        let row: any[] = [];
                        let lastVal = null, span = 0;
                        for (let i = 0; i < colLevels.length; i++) {
                          let val = Array.isArray(colLevels[i]) ? colLevels[i][level] : (level === 0 ? colLevels[i] : "");
                          if (val === lastVal) {
                            span++;
                          } else {
                            if (lastVal !== null) {
                              row.push(<th className="border p-2 text-center" colSpan={span}>{lastVal}</th>);
                            }
                            lastVal = val;
                            span = 1;
                          }
                        }
                        if (lastVal !== null) {
                          row.push(<th className="border p-2 text-center" colSpan={span}>{lastVal}</th>);
                        }
                        headerRows.push(<tr key={level} className="bg-muted/50">{level === 0 && rowVars.length ? <th className="border p-2 text-left" rowSpan={maxColDepth}>{rowVars.join(' / ')}</th> : null}{row}</tr>);
                      }
                      return headerRows;
                    })()}
                  </thead>
                  <tbody>
                    {/* Dynamically render all rows */}
                    {(() => {
                      const table = data.table || {};
                      const rowKeys = Object.keys(table[colVars && colVars.length ? Object.keys(table)[0] : ""] || {});
                      const colKeys = Object.keys(table);
                      if (colKeys.length === 0) return null;
                      // If table is 2D: table[col][row] = value
                      // Build all row keys from the first column
                      const allRowKeys: string[] = [];
                      colKeys.forEach(col => {
                        Object.keys(table[col] || {}).forEach(row => {
                          if (!allRowKeys.includes(row)) allRowKeys.push(row);
                        });
                      });
                      return allRowKeys.map((rowKey: string, i: number) => (
                        <tr key={rowKey}>
                          <td className="border p-2 text-left">{rowKey}</td>
                          {colKeys.map((colKey: string) => (
                            <td key={colKey} className="border p-2 text-center">{table[colKey][rowKey] ?? 0}</td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
                {/* Render stats if present */}
                {data.stats && (
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
                          <td className="border p-2 text-center">{data.stats.chi_square?.chi2?.toFixed(3)}</td>
                          <td className="border p-2 text-center">{data.stats.chi_square?.dof}</td>
                          <td className="border p-2 text-center">{data.stats.chi_square?.p?.toFixed(3)}</td>
                        </tr>
                        {/* Add more stats as needed */}
                      </tbody>
                    </table>
                  </div>
                )}
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
