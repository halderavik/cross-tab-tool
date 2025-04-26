import { useData } from '../contexts/data-context'

export const DataTable = () => {
  const { sampleData } = useData()

  if (!sampleData) {
    return <div>No data available</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {sampleData.columns.map((column) => (
              <th
                key={column}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sampleData.data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {sampleData.columns.map((column) => (
                <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 