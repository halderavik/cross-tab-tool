# Statistical Testing Components

This document provides examples and usage guidelines for the statistical testing components in the cross-tabulation tool.

## Components Overview

The statistical testing system consists of three main parts:
1. Type definitions (`statistical.ts`)
2. Results display component (`StatisticalTestResults.tsx`)
3. Testing hook (`useStatisticalTests.ts`)

## Basic Usage Example

Here's a complete example of how to use the statistical testing components in a cross-tabulation view:

```typescript
import React, { useState } from 'react';
import { useStatisticalTests } from '../hooks/useStatisticalTests';
import { StatisticalTestResults } from '../components/StatisticalTestResults';
import { CrossTabWithStats, StatisticalTestOptions } from '../types/statistical';

const CrossTabView: React.FC = () => {
    const { performTest, loading, error } = useStatisticalTests();
    const [testResults, setTestResults] = useState<StatisticalTestResult | null>(null);

    // Example cross-tab data
    const crossTabData: CrossTabWithStats = {
        observed: [
            [10, 20],
            [30, 40]
        ],
        row_labels: ['Group A', 'Group B'],
        col_labels: ['Category 1', 'Category 2'],
        row_totals: [30, 70],
        col_totals: [40, 60],
        grand_total: 100
    };

    const handleTest = async () => {
        const options: StatisticalTestOptions = {
            test_type: 'chi_square',
            alpha: 0.05
        };

        const results = await performTest(crossTabData, options);
        setTestResults(results);
    };

    return (
        <div className="p-4">
            <button 
                onClick={handleTest}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {loading ? 'Running Test...' : 'Perform Statistical Test'}
            </button>

            {error && (
                <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
                    Error: {error}
                </div>
            )}

            {testResults && (
                <div className="mt-4">
                    <StatisticalTestResults results={testResults} />
                </div>
            )}
        </div>
    );
};
```

## Advanced Usage Examples

### 1. Conditional Test Selection

```typescript
const getAppropriateTest = (data: CrossTabWithStats): StatisticalTestOptions => {
    // For 2x2 tables, use Fisher's exact test
    if (data.observed.length === 2 && data.observed[0].length === 2) {
        return { test_type: 'fisher_exact' };
    }
    // For larger tables, use chi-square
    return { test_type: 'chi_square' };
};

// Usage:
const options = getAppropriateTest(crossTabData);
const results = await performTest(crossTabData, options);
```

### 2. Custom Styling

```typescript
// Custom styling for the results component
<StatisticalTestResults 
    results={testResults}
    className="border-2 border-blue-200"
/>
```

### 3. Error Handling

```typescript
const handleTest = async () => {
    try {
        const results = await performTest(crossTabData, {
            test_type: 'chi_square',
            alpha: 0.05
        });
        
        if (results) {
            setTestResults(results);
        } else {
            // Handle case where test couldn't be performed
            setError('Unable to perform statistical test');
        }
    } catch (err) {
        setError('An unexpected error occurred');
    }
};
```

## Type Definitions

### CrossTabWithStats
```typescript
interface CrossTabWithStats {
    observed: number[][];
    row_labels: string[];
    col_labels: string[];
    row_totals: number[];
    col_totals: number[];
    grand_total: number;
    stats?: StatisticalTestResult;
}
```

### StatisticalTestOptions
```typescript
interface StatisticalTestOptions {
    alpha?: number;  // Default: 0.05
    test_type: 'chi_square' | 'fisher_exact';
}
```

## Best Practices

1. **Test Selection**
   - Use Fisher's exact test for 2x2 tables
   - Use chi-square test for larger tables
   - Consider sample size when choosing tests

2. **Error Handling**
   - Always check for errors in the response
   - Provide meaningful error messages to users
   - Handle edge cases (e.g., zero counts)

3. **Performance**
   - Cache test results when possible
   - Consider debouncing test requests for large datasets
   - Show loading states during computation

4. **Accessibility**
   - Ensure color-coded significance levels have text alternatives
   - Provide clear labels for all numerical values
   - Make sure the component is keyboard navigable

## Common Issues and Solutions

1. **Missing Data**
   ```typescript
   // Handle missing data before testing
   const cleanData = crossTabData.observed.map(row => 
       row.map(cell => cell || 0)
   );
   ```

2. **Small Sample Sizes**
   ```typescript
   // Check sample size before choosing test
   const totalSampleSize = crossTabData.grand_total;
   const useFisher = totalSampleSize < 20;
   ```

3. **Zero Counts**
   ```typescript
   // Handle zero counts in expected frequencies
   const hasZeroExpected = results.expected.some(row => 
       row.some(cell => cell === 0)
   );
   if (hasZeroExpected) {
       // Consider using Fisher's exact test or warn user
   }
   ``` 