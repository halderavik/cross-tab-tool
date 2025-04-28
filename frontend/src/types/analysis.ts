export interface AgentResponse {
  analysis_type: string;
  variables: string[];
  results: {
    crosstab?: Record<string, Record<string, number>>;
    chi_square?: {
      statistic: number;
      p_value: number;
      degrees_of_freedom: number;
    };
    descriptive_stats?: {
      count: number;
      mean?: number;
      std?: number;
      min?: number;
      '25%'?: number;
      '50%'?: number;
      '75%'?: number;
      max?: number;
      unique?: number;
      top?: string;
      freq?: number;
    };
  };
  explanation: string;
  visualization_suggestion?: string;
  columns_used?: string[];
}

export interface CrossTabResult {
  table: Record<string, Record<string, number>>;
  chi_square?: {
    statistic: number;
    p_value: number;
    degrees_of_freedom: number;
  };
} 