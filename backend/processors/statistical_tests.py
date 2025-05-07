"""
Statistical testing module for cross-tabulation analysis.

This module provides functions for performing statistical tests on cross-tabulated data,
including chi-square tests and exact tests, with significance marking capabilities.
"""

from typing import Tuple, Dict, Any
import numpy as np
from scipy import stats
import pandas as pd
import logging

logger = logging.getLogger(__name__)

def chi_square(observed: np.ndarray, expected: np.ndarray = None) -> Dict[str, Any]:
    """
    Perform chi-square test on observed frequencies.
    
    Args:
        observed (np.ndarray): 2D array of observed frequencies
        expected (np.ndarray, optional): 2D array of expected frequencies. If None,
            will be calculated from observed frequencies.
    
    Returns:
        Dict[str, Any]: Dictionary containing test results including:
            - chi2: chi-square statistic
            - p_value: p-value
            - dof: degrees of freedom
            - expected: expected frequencies
            - significant: boolean indicating if result is significant at 0.05 level
    """
    try:
        if expected is None:
            # Calculate expected frequencies
            row_totals = observed.sum(axis=1, keepdims=True)
            col_totals = observed.sum(axis=0, keepdims=True)
            total = observed.sum()
            expected = row_totals * col_totals / total
        
        # Perform chi-square test
        chi2, p_value, dof, _ = stats.chi2_contingency(observed)
        
        return {
            "chi2": float(chi2),
            "p_value": float(p_value),
            "dof": int(dof),
            "expected": expected.tolist(),
            "significant": p_value < 0.05
        }
    except Exception as e:
        logger.error(f"Error in chi-square test: {str(e)}")
        raise ValueError(f"Error performing chi-square test: {str(e)}")

def fisher_exact(observed: np.ndarray) -> Dict[str, Any]:
    """
    Perform Fisher's exact test on a 2x2 contingency table.
    
    Args:
        observed (np.ndarray): 2x2 array of observed frequencies
    
    Returns:
        Dict[str, Any]: Dictionary containing test results including:
            - odds_ratio: odds ratio
            - p_value: p-value
            - significant: boolean indicating if result is significant at 0.05 level
    """
    try:
        if observed.shape != (2, 2):
            raise ValueError("Fisher's exact test requires a 2x2 contingency table")
        
        odds_ratio, p_value = stats.fisher_exact(observed)
        
        return {
            "odds_ratio": float(odds_ratio),
            "p_value": float(p_value),
            "significant": p_value < 0.05
        }
    except Exception as e:
        logger.error(f"Error in Fisher's exact test: {str(e)}")
        raise ValueError(f"Error performing Fisher's exact test: {str(e)}")

def mark_significance(results: Dict[str, Any], alpha: float = 0.05) -> Dict[str, Any]:
    """
    Add significance markers to test results.
    
    Args:
        results (Dict[str, Any]): Dictionary containing test results
        alpha (float): Significance level (default: 0.05)
    
    Returns:
        Dict[str, Any]: Results dictionary with added significance markers
    """
    try:
        p_value = results.get("p_value")
        if p_value is None:
            return results
        
        # Add significance markers
        if p_value < alpha:
            results["significance"] = "*"  # Significant at alpha level
            if p_value < alpha/10:
                results["significance"] = "**"  # Highly significant
        else:
            results["significance"] = "ns"  # Not significant
        
        return results
    except Exception as e:
        logger.error(f"Error marking significance: {str(e)}")
        return results 