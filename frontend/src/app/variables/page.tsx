import { CustomVariableBuilder } from "@/components/custom-variable-builder"
import { useData } from "@/contexts/data-context"

export default function VariablesPage() {
  const { addCustomVariable } = useData()

  const handleVariableCreated = (newVariable: any) => {
    addCustomVariable({
      id: Date.now(),
      name: newVariable.name,
      label: newVariable.label,
      type: 'custom',
      conditions: newVariable.conditions
    })
  }

  return (
    <div className="w-full px-0 py-8 max-w-none">
      <h1 className="text-2xl font-bold mb-6">Variable Management</h1>
      <div className="grid gap-6 w-full">
        <CustomVariableBuilder onVariableCreated={handleVariableCreated} />
      </div>
    </div>
  )
} 