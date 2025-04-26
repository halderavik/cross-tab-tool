import { useData } from '@/contexts/data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SampleData {
  columns: string[]
  data: Record<string, any>[]
}

export function SampleData() {
  const { sampleData } = useData()

  if (!sampleData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sample Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data loaded yet. Upload a file to see sample data.</p>
        </CardContent>
      </Card>
    )
  }

  const typedSampleData = sampleData as SampleData

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {typedSampleData.columns.map((column: string) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {typedSampleData.data.map((row: Record<string, any>, rowIndex: number) => (
                <TableRow key={rowIndex}>
                  {typedSampleData.columns.map((column: string) => (
                    <TableCell key={`${rowIndex}-${column}`}>{row[column]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 