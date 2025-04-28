/**
 * Type definitions for statistical testing results
 */

export interface ChiSquareTestResult {
    chi2: number;
    p_value: number;
    dof: number;
    expected: number[][];
    significant: boolean;
    significance?: string;
}

export interface FisherExactTestResult {
    odds_ratio: number;
    p_value: number;
    significant: boolean;
    significance?: string;
}

export type StatisticalTestResult = ChiSquareTestResult | FisherExactTestResult;

export interface StatisticalTestOptions {
    alpha?: number;
    test_type: 'chi_square' | 'fisher_exact';
}

export interface CrossTabWithStats {
    observed: number[][];
    row_labels: string[];
    col_labels: string[];
    row_totals: number[];
    col_totals: number[];
    grand_total: number;
    stats?: StatisticalTestResult;
} 