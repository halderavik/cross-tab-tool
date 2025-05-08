# Communication with AI Agent

This document provides example prompts, code examples, and output types for interacting with the AI Agent to access various cross-tabulation features.

## Table of Contents
1. [Multiple-Response Analysis](#multiple-response-analysis)
2. [Custom Variables & Recodes](#custom-variables--recodes)
3. [Subtotals & Net Rows](#subtotals--net-rows)
4. [Advanced Statistical Tests](#advanced-statistical-tests)
5. [Batch Table Generation](#batch-table-generation)
6. [Conditional Formatting](#conditional-formatting)
7. [Report Generation](#report-generation)
8. [Multi-Step Analysis](#multi-step-analysis)

## Multiple-Response Analysis

**Example Prompts:**
- "Show me the distribution of all selected responses for the 'Which social media platforms do you use?' question"
- "Create a crosstab of all selected brands against age groups"
- "What percentage of respondents selected each combination of features?"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Show distribution of social media platforms by age group",
  context: {
    multiple_response_vars: ["social_media_platforms"],
    row_vars: ["age_group"],
    col_vars: ["social_media_platforms"]
  }
};

// Response type
interface MultipleResponseResult {
  table: {
    data: Record<string, Record<string, number>>;
    variable_types: {
      row: 'categorical' | 'numeric';
      column: 'categorical' | 'numeric';
    };
  };
  statistics: {
    chi_square?: {
      statistic: number;
      p_value: number;
      degrees_of_freedom: number;
      significant: boolean;
      significance: string;
    };
  };
}
```

**Tips:**
- Specify if you want to see individual counts or percentages
- Mention if you want to compare against other variables
- Ask for specific combinations of responses

## Custom Variables & Recodes

**Example Prompts:**
- "Combine the 'Very Satisfied' and 'Satisfied' responses into a single 'Positive' category"
- "Create a new variable that groups ages into 'Young', 'Middle', and 'Senior'"
- "Recode the income brackets into three categories: Low, Medium, High"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Recode satisfaction into positive/negative",
  context: {
    custom_variables: [{
      name: "satisfaction_recoded",
      conditions: [
        {
          column: "satisfaction",
          comparison: "equals",
          value: "Very Satisfied",
          operator: "OR"
        },
        {
          column: "satisfaction",
          comparison: "equals",
          value: "Satisfied"
        }
      ],
      new_value: "Positive"
    }]
  }
};

// Response type
interface RecodeResult {
  new_variable: string;
  mapping: Record<string, string>;
  validation: {
    original_categories: string[];
    new_categories: string[];
    counts: Record<string, number>;
  };
}
```

**Tips:**
- Clearly specify the categories you want to combine
- Define the new category names
- Ask for verification of the recoding

## Subtotals & Net Rows

**Example Prompts:**
- "Add a 'Top 2 Box' row showing the sum of 'Very Satisfied' and 'Satisfied' responses"
- "Show me the net promoter score by region"
- "Calculate the total percentage for positive responses"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Calculate Top 2 Box score",
  context: {
    subtotals: [{
      name: "Top 2 Box",
      categories: ["Very Satisfied", "Satisfied"],
      operation: "sum",
      display_as: "percentage"
    }]
  }
};

// Response type
interface SubtotalResult {
  table: {
    data: Record<string, Record<string, number>>;
    subtotals: {
      name: string;
      value: number;
      percentage: number;
    }[];
  };
}
```

**Tips:**
- Specify which categories to include in the subtotal
- Define how you want the subtotal calculated
- Ask for percentage breakdowns if needed

## Advanced Statistical Tests

**Example Prompts:**
- "Compare the satisfaction scores between regions using t-tests"
- "Show me if there are significant differences in brand preference by age group"
- "Calculate the median income for each education level"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Compare satisfaction by region",
  context: {
    statistical_tests: {
      type: "anova", // or "chi_square", "correlation"
      variables: ["satisfaction", "region"],
      significance_level: 0.05
    }
  }
};

// Response type
interface StatisticalTestResult {
  test_type: string;
  results: {
    statistic: number;
    p_value: number;
    significant: boolean;
    significance: string;
    interpretation: string;
  };
  variable_types: {
    row: 'categorical' | 'numeric';
    column: 'categorical' | 'numeric';
  };
}
```

**Tips:**
- Specify the comparison groups
- Mention the type of test you want
- Ask for interpretation of the results

## Batch Table Generation

**Example Prompts:**
- "Create crosstabs for all demographic variables against satisfaction"
- "Generate tables for all brand metrics by region"
- "Show me all possible combinations of these three variables"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Generate demographic crosstabs",
  context: {
    batch_analysis: {
      row_variables: ["age", "gender", "education"],
      column_variables: ["satisfaction"],
      statistics: ["chi_square", "cramer_v"]
    }
  }
};

// Response type
interface BatchAnalysisResult {
  tables: Array<{
    row_var: string;
    col_var: string;
    data: Record<string, Record<string, number>>;
    statistics: Record<string, any>;
  }>;
  summary: {
    total_tables: number;
    significant_findings: number;
  };
}
```

**Tips:**
- List the variables you want to analyze
- Specify any filters or conditions
- Ask for specific table formats

## Conditional Formatting

**Example Prompts:**
- "Highlight cells where the percentage is above 50%"
- "Show me a heatmap of the satisfaction scores"
- "Mark significant differences with an asterisk"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Highlight significant differences",
  context: {
    formatting: {
      conditions: [{
        type: "threshold",
        value: 50,
        operator: "greater_than",
        style: "highlight"
      }],
      significance_markers: true
    }
  }
};

// Response type
interface FormattedResult {
  table: {
    data: Record<string, Record<string, number>>;
    formatting: {
      cell: string;
      style: string;
      value: number;
    }[];
  };
}
```

**Tips:**
- Specify the conditions for formatting
- Define the visual style you prefer
- Ask for explanation of the formatting

## Report Generation

**Example Prompts:**
- "Create a PowerPoint report with the key findings"
- "Export these tables to Excel with proper formatting"
- "Generate a PDF report with all the analysis"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Generate PowerPoint report",
  context: {
    report: {
      format: "powerpoint",
      sections: ["summary", "tables", "statistics"],
      styling: {
        theme: "corporate",
        include_charts: true
      }
    }
  }
};

// Response type
interface ReportResult {
  report_url: string;
  sections: Array<{
    title: string;
    content: string | Record<string, any>;
    type: "text" | "table" | "chart";
  }>;
  metadata: {
    generated_at: string;
    format: string;
    size: number;
  };
}
```

**Tips:**
- Specify the format you want
- List the tables to include
- Define any specific styling requirements

## Multi-Step Analysis

**Example Prompts:**
- "First recode the satisfaction scale, then create a crosstab with age groups, and finally highlight significant differences"
- "Combine these categories, create a net score, and show me the regional breakdown"
- "Create a custom variable for brand loyalty, then analyze it by demographics"

**Example Code:**
```typescript
// Request format
const request = {
  file_id: 123,
  query: "Multi-step analysis of satisfaction",
  context: {
    steps: [
      {
        type: "recode",
        variables: ["satisfaction"],
        new_categories: ["Positive", "Neutral", "Negative"]
      },
      {
        type: "crosstab",
        row_vars: ["age_group"],
        col_vars: ["satisfaction_recoded"]
      },
      {
        type: "statistical_test",
        test: "chi_square"
      }
    ]
  }
};

// Response type
interface MultiStepResult {
  steps: Array<{
    type: string;
    result: any;
    status: "success" | "error";
  }>;
  final_result: {
    table: Record<string, Record<string, number>>;
    statistics: Record<string, any>;
  };
}
```

**Tips:**
- Break down complex requests into steps
- Specify the order of operations
- Ask for intermediate results if needed

## Best Practices

1. **Be Specific:**
   - Clearly state what you want to analyze
   - Specify the variables of interest
   - Define any conditions or filters

2. **Use Natural Language:**
   - Ask questions as you would to a human analyst
   - Provide context when needed
   - Don't hesitate to ask for clarification

3. **Request Verification:**
   - Ask the agent to confirm its understanding
   - Request explanation of the methodology
   - Ask for alternative approaches

4. **Iterative Analysis:**
   - Start with broad questions
   - Refine based on initial results
   - Ask follow-up questions

5. **Error Handling:**
   - If you get unexpected results, ask why
   - Request alternative approaches
   - Ask for troubleshooting help 