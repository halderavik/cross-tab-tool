import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const helpContent = `# Cross Tab Tool Help

## Overview

The Cross Tab Tool helps you analyze relationships between variables in your data through cross-tabulation.

## Features

### Data Loading
- Supports SPSS (.sav) and CSV files
- Automatic variable type detection
- Handles missing values

### Analysis Options
- Select row and column variables
- Apply weights
- Filter by subgroups
- Calculate percentages and statistics

### Results
- Interactive tables
- Export to various formats
- Statistical tests

## Tips

1. Load your data file first
2. Select meaningful row and column variables
3. Use weights if your data is weighted
4. Apply subgroup filters to focus on specific segments

## Math Example

The chi-square test statistic is calculated as:

\\[ \\chi^2 = \\sum \\frac{(O_i - E_i)^2}{E_i} \\]

where:
- \\(O_i\\) is the observed frequency
- \\(E_i\\) is the expected frequency

## Need More Help?
Contact support at support@example.com`;

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Help</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cross Tab Tool Help</DialogTitle>
        </DialogHeader>
        <div className="prose dark:prose-invert">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {helpContent}
          </ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
} 