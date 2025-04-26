import React, { act } from 'react'
import { render, screen } from '@testing-library/react'
import { DataProvider, useData } from '../data-context'
import '@testing-library/jest-dom'

// Test component to use the context
const TestComponent = () => {
  const { sampleData, setSampleData, variableSummary, setVariableSummary } = useData()
  
  return (
    <div>
      <div data-testid="sample-data">
        {sampleData ? JSON.stringify(sampleData) : 'No sample data'}
      </div>
      <div data-testid="variable-summary">
        {variableSummary ? JSON.stringify(variableSummary) : 'No variable summary'}
      </div>
      <button
        onClick={() => setSampleData({ columns: ['test'], data: [{ test: 1 }] })}
        data-testid="set-sample-data"
      >
        Set Sample Data
      </button>
      <button
        onClick={() => setVariableSummary({ test: { min: 0, max: 1, mean: 0.5, std: 0.5, missing: 0 } })}
        data-testid="set-variable-summary"
      >
        Set Variable Summary
      </button>
    </div>
  )
}

describe('DataContext', () => {
  it('should provide initial null values', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    )

    expect(screen.getByTestId('sample-data')).toHaveTextContent('No sample data')
    expect(screen.getByTestId('variable-summary')).toHaveTextContent('No variable summary')
  })

  it('should update sample data when setSampleData is called', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    )

    act(() => {
      screen.getByTestId('set-sample-data').click()
    })

    expect(screen.getByTestId('sample-data')).toHaveTextContent(
      JSON.stringify({ columns: ['test'], data: [{ test: 1 }] })
    )
  })

  it('should update variable summary when setVariableSummary is called', () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    )

    act(() => {
      screen.getByTestId('set-variable-summary').click()
    })

    expect(screen.getByTestId('variable-summary')).toHaveTextContent(
      JSON.stringify({ test: { min: 0, max: 1, mean: 0.5, std: 0.5, missing: 0 } })
    )
  })

  it('should throw an error when useData is used outside of DataProvider', () => {
    const TestComponentWithoutProvider = () => {
      useData()
      return null
    }

    // Suppress console error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponentWithoutProvider />)
    }).toThrow('useData must be used within a DataProvider')

    console.error = originalError
  })
}) 