import React from 'react';
import { StatisticalTestResult, ChiSquareTestResult, FisherExactTestResult } from '../types/statistical';

interface StatisticalTestResultsProps {
    results: StatisticalTestResult;
    className?: string;
}

export const StatisticalTestResults: React.FC<StatisticalTestResultsProps> = ({ results, className = '' }) => {
    const renderChiSquareResults = (results: ChiSquareTestResult) => (
        <div className="space-y-2">
            <div className="flex justify-between">
                <span>Chi-square statistic:</span>
                <span className="font-mono">{results.chi2.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
                <span>Degrees of freedom:</span>
                <span className="font-mono">{results.dof}</span>
            </div>
            <div className="flex justify-between">
                <span>P-value:</span>
                <span className="font-mono">{results.p_value.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
                <span>Significance:</span>
                <span className={`font-bold ${results.significant ? 'text-green-600' : 'text-gray-600'}`}>
                    {results.significance}
                </span>
            </div>
        </div>
    );

    const renderFisherExactResults = (results: FisherExactTestResult) => (
        <div className="space-y-2">
            <div className="flex justify-between">
                <span>Odds ratio:</span>
                <span className="font-mono">{results.odds_ratio.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
                <span>P-value:</span>
                <span className="font-mono">{results.p_value.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
                <span>Significance:</span>
                <span className={`font-bold ${results.significant ? 'text-green-600' : 'text-gray-600'}`}>
                    {results.significance}
                </span>
            </div>
        </div>
    );

    return (
        <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
            <h3 className="text-lg font-semibold mb-4">Statistical Test Results</h3>
            {'chi2' in results ? renderChiSquareResults(results) : renderFisherExactResults(results)}
        </div>
    );
}; 