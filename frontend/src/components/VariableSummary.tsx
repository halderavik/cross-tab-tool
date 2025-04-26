import { useData } from '../contexts/data-context'

export const VariableSummary = () => {
  const { variableSummary } = useData()

  if (!variableSummary) {
    return <div>No variable summary available</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Variable
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Min
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Max
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mean
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Std Dev
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Missing
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(variableSummary).map(([variable, stats]) => (
            <tr key={variable}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variable}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.min}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.max}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.mean}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.std}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.missing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 