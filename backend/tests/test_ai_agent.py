"""
Unit tests for the AI agent functionality.
"""

import pytest
import pandas as pd
import numpy as np
from ..ai.agent import CrossTabAgent, AnalysisContext, AgentResponse

@pytest.fixture
def sample_dataset():
    """Create a sample dataset for testing."""
    data = {
        'category': ['A', 'B', 'A', 'B', 'A', 'B'],
        'value': [1, 2, 1, 2, 1, 2],
        'score': [10, 20, 30, 40, 50, 60]
    }
    return pd.DataFrame(data)

@pytest.fixture
def agent():
    """Create an instance of the CrossTabAgent."""
    return CrossTabAgent(api_key="test_key")

def test_analysis_context_creation(sample_dataset):
    """Test creation of AnalysisContext."""
    context = AnalysisContext(
        dataset=sample_dataset,
        variable_metadata={
            'category': {'type': 'object', 'unique_values': 2, 'missing_values': 0},
            'value': {'type': 'int64', 'unique_values': 2, 'missing_values': 0},
            'score': {'type': 'int64', 'unique_values': 6, 'missing_values': 0}
        }
    )
    
    assert isinstance(context.dataset, pd.DataFrame)
    assert len(context.variable_metadata) == 3
    assert context.current_analysis is None
    assert len(context.analysis_history) == 0

def test_agent_response_creation():
    """Test creation of AgentResponse."""
    response = AgentResponse(
        analysis_type="crosstab",
        variables=["category", "value"],
        results={
            "crosstab": {"A": {"1": 3, "2": 0}, "B": {"1": 0, "2": 3}},
            "chi_square": {"statistic": 6.0, "p_value": 0.014, "degrees_of_freedom": 1}
        },
        explanation="Test explanation",
        visualization_suggestion="bar_chart"
    )
    
    assert response.analysis_type == "crosstab"
    assert len(response.variables) == 2
    assert "crosstab" in response.results
    assert response.explanation == "Test explanation"
    assert response.visualization_suggestion == "bar_chart"

def test_agent_initialization(agent):
    """Test CrossTabAgent initialization."""
    assert agent.api_key == "test_key"
    assert agent.base_url == "https://api.deepseek.com/v1"
    assert "Authorization" in agent.headers
    assert "Content-Type" in agent.headers

def test_prepare_context_prompt(agent, sample_dataset):
    """Test context prompt preparation."""
    context = AnalysisContext(
        dataset=sample_dataset,
        variable_metadata={
            'category': {'type': 'object', 'unique_values': 2, 'missing_values': 0},
            'value': {'type': 'int64', 'unique_values': 2, 'missing_values': 0}
        }
    )
    
    prompt = agent._prepare_context_prompt(context, "Show me the relationship between category and value")
    
    assert "category" in prompt
    assert "value" in prompt
    assert "Show me the relationship" in prompt

def test_execute_crosstab(agent, sample_dataset):
    """Test cross-tabulation execution."""
    context = AnalysisContext(
        dataset=sample_dataset,
        variable_metadata={
            'category': {'type': 'object', 'unique_values': 2, 'missing_values': 0},
            'value': {'type': 'int64', 'unique_values': 2, 'missing_values': 0}
        }
    )
    
    plan = {
        "type": "crosstab",
        "variables": ["category", "value"]
    }
    
    results = agent._execute_crosstab(context, plan)
    
    assert "crosstab" in results
    assert "chi_square" in results
    assert "statistic" in results["chi_square"]
    assert "p_value" in results["chi_square"]
    assert "degrees_of_freedom" in results["chi_square"]

def test_execute_descriptive(agent, sample_dataset):
    """Test descriptive statistics execution."""
    context = AnalysisContext(
        dataset=sample_dataset,
        variable_metadata={
            'score': {'type': 'int64', 'unique_values': 6, 'missing_values': 0}
        }
    )
    
    plan = {
        "type": "descriptive",
        "variables": ["score"]
    }
    
    results = agent._execute_descriptive(context, plan)
    
    assert "descriptive_stats" in results
    stats = results["descriptive_stats"]
    assert "mean" in stats
    assert "std" in stats
    assert "min" in stats
    assert "max" in stats 