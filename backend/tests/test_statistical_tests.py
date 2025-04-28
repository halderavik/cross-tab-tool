"""
Tests for the statistical testing module.
"""

import numpy as np
import pytest
from processors.statistical_tests import (
    chi_square_test,
    fisher_exact_test,
    mark_significance
)

def test_chi_square_test_basic():
    """Test basic chi-square test functionality."""
    # Create a simple 2x2 contingency table
    observed = np.array([[10, 20], [30, 40]])
    
    results = chi_square_test(observed)
    
    assert "chi2" in results
    assert "p_value" in results
    assert "dof" in results
    assert "expected" in results
    assert "significant" in results
    assert isinstance(results["significant"], bool)

def test_chi_square_test_with_expected():
    """Test chi-square test with provided expected frequencies."""
    observed = np.array([[10, 20], [30, 40]])
    expected = np.array([[12, 18], [28, 42]])
    
    results = chi_square_test(observed, expected)
    
    assert np.array_equal(results["expected"], expected)

def test_fisher_exact_test():
    """Test Fisher's exact test functionality."""
    # Create a 2x2 contingency table
    observed = np.array([[10, 20], [30, 40]])
    
    results = fisher_exact_test(observed)
    
    assert "odds_ratio" in results
    assert "p_value" in results
    assert "significant" in results
    assert isinstance(results["significant"], bool)

def test_fisher_exact_test_invalid_input():
    """Test Fisher's exact test with invalid input."""
    # Create a 3x3 table (invalid for Fisher's exact test)
    observed = np.array([[10, 20, 30], [40, 50, 60], [70, 80, 90]])
    
    with pytest.raises(ValueError):
        fisher_exact_test(observed)

def test_mark_significance():
    """Test significance marking functionality."""
    # Test case 1: Significant result
    results1 = {"p_value": 0.01}
    marked1 = mark_significance(results1)
    assert marked1["significance"] == "**"
    
    # Test case 2: Marginally significant result
    results2 = {"p_value": 0.04}
    marked2 = mark_significance(results2)
    assert marked2["significance"] == "*"
    
    # Test case 3: Non-significant result
    results3 = {"p_value": 0.10}
    marked3 = mark_significance(results3)
    assert marked3["significance"] == "ns"
    
    # Test case 4: No p-value
    results4 = {"other_value": 42}
    marked4 = mark_significance(results4)
    assert "significance" not in marked4

def test_mark_significance_custom_alpha():
    """Test significance marking with custom alpha level."""
    results = {"p_value": 0.06}
    marked = mark_significance(results, alpha=0.10)
    assert marked["significance"] == "*" 