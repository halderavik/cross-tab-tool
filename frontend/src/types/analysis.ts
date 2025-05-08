export interface AgentResponse {
  analysis_type: string;
  variables: string[];
  results: {
    table?: {
      data: Record<string, Record<string, number>>;
      original_index?: string[];
      original_columns?: string[];
      variable_types?: {
        row: 'categorical' | 'numeric';
        column: 'categorical' | 'numeric';
      };
    };
    statistics?: {
      chi_square?: {
        statistic: number;
        p_value: number;
        degrees_of_freedom: number;
        significant: boolean;
        significance: string;
      };
      cramer_v?: {
        value: number;
        interpretation: string;
      };
      anova?: {
        statistic: number;
        p_value: number;
        significant: boolean;
        significance: string;
      };
      correlation?: {
        coefficient: number;
        p_value: number;
        significant: boolean;
        significance: string;
        interpretation: string;
      };
    };
    descriptive_stats?: Record<string, number>;
    distribution?: {
      counts: Record<string, number>;
      percentages: Record<string, number>;
      total: number;
    };
  };
  explanation: string;
  visualization_suggestion?: string;
  questions_used?: string[];
  columns_used?: string[];
}

export interface CrossTabResult {
  table: Record<string, Record<string, number>>;
  variable_types: {
    row: 'categorical' | 'numeric';
    column: 'categorical' | 'numeric';
  };
  statistics: {
    chi_square?: {
      statistic: number;
      p_value: number;
      degrees_of_freedom: number;
      significant: boolean;
      significance: string;
    };
    cramer_v?: {
      value: number;
      interpretation: string;
    };
    anova?: {
      statistic: number;
      p_value: number;
      significant: boolean;
      significance: string;
    };
    correlation?: {
      coefficient: number;
      p_value: number;
      significant: boolean;
      significance: string;
      interpretation: string;
    };
  };
} 