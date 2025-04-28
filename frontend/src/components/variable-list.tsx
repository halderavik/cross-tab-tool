import { useData } from '@/contexts/data-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function VariableList() {
  const { variables } = useData()

  if (variables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No variables loaded yet. Upload a file to see variables.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variables</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {variables.map((variable) => (
            <div key={variable.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">{variable.name}</h3>
                {variable.label && <p className="text-sm text-muted-foreground">{variable.label}</p>}
              </div>
              <Badge variant="outline">{variable.type}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 