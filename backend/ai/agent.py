"""
AI Agent service for cross-tabulation analysis using DeepSeek R1.
"""

import os
from typing import Dict, List, Optional, Any
import requests
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
from scipy import stats
import json
import logging
from scipy.stats import chi2_contingency
from fastapi import HTTPException
from processors.statistical_tests import chi_square, fisher_exact, mark_significance

logger = logging.getLogger(__name__)

class AnalysisContext(BaseModel):
    """Context for the AI agent's analysis."""
    dataset: pd.DataFrame
    variable_metadata: Dict[str, Dict[str, Any]]
    current_analysis: Optional[Dict[str, Any]] = None
    analysis_history: List[Dict[str, Any]] = Field(default_factory=list)
    multiple_response_vars: Optional[Dict[str, List[str]]] = None  # {variable: [options]}
    file_path: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

class AgentResponse(BaseModel):
    """Response from the AI agent."""
    analysis_type: str
    variables: List[str]
    results: Dict[str, Any]
    explanation: str
    visualization_suggestion: Optional[str] = None
    questions_used: Optional[List[str]] = None
    columns_used: Optional[List[str]] = None

class CrossTabAgent:
    """AI agent for cross-tabulation analysis."""
    
    def __init__(self, api_key: str):
        """Initialize the agent with DeepSeek API key."""
        self.api_key = api_key
        self.base_url = "https://api.deepseek.com/v1"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def _call_deepseek(self, prompt: str) -> str:
        """Make a call to the DeepSeek R1 API with detailed logging for debugging."""
        payload = {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        logger.info(f"Calling DeepSeek API: {self.base_url}/chat/completions")
        logger.info(f"Headers: {self.headers}")
        logger.info(f"Payload: {json.dumps(payload)}")
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            logger.info(f"DeepSeek API response: {response.text}")
            return response.json()["choices"][0]["message"]["content"]
        except requests.exceptions.HTTPError as e:
            logger.error(f"DeepSeek API HTTPError: {e}")
            try:
                logger.error(f"DeepSeek API error response: {response.text}")
            except Exception:
                pass
            raise
        except Exception as e:
            logger.error(f"DeepSeek API unexpected error: {e}")
            raise
    
    def analyze_crosstab(self, context: AnalysisContext, query: str) -> Dict[str, Any]:
        """
        Analyze data using the AI agent.
        
        Args:
            context: Analysis context containing dataset and metadata
            query: User's query
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Get analysis plan from LLM
            analysis_plan = self._get_analysis_plan(query, context)
            logger.info(f"Analysis plan: {analysis_plan}")
            
            # Perform analysis based on plan
            results = {}
            
            if analysis_plan["type"] == "distribution":
                # Calculate distribution for binary/categorical variables
                var = analysis_plan["variables"][0]
                if var in context.dataset.columns:
                    value_counts = context.dataset[var].value_counts()
                    total = value_counts.sum()
                    
                    # Calculate percentages
                    percentages = (value_counts / total * 100).round(2)
                    
                    results["distribution"] = {
                        "counts": value_counts.to_dict(),
                        "percentages": percentages.to_dict(),
                        "total": int(total)
                    }
                    
                    # Add chi-square test for binary variables
                    if len(value_counts) == 2:
                        expected = total / 2
                        chi2 = ((value_counts - expected) ** 2 / expected).sum()
                        p_value = 1 - stats.chi2.cdf(chi2, 1)
                        results["statistics"] = {
                            "chi_square": {
                                "statistic": float(chi2),
                                "p_value": float(p_value),
                                "degrees_of_freedom": 1,
                                "significant": p_value < 0.05,
                                "significance": "significant" if p_value < 0.05 else "not significant"
                            }
                        }
            
            elif analysis_plan["type"] == "descriptive":
                # Perform descriptive statistics
                for var in analysis_plan["variables"]:
                    if var in context.dataset.columns:
                        stats = context.dataset[var].describe()
                        results["descriptive_stats"] = {
                            "count": float(stats["count"]),
                            "mean": float(stats["mean"]),
                            "std": float(stats["std"]),
                            "min": float(stats["min"]),
                            "25%": float(stats["25%"]),
                            "50%": float(stats["50%"]),
                            "75%": float(stats["75%"]),
                            "max": float(stats["max"])
                        }
            
            elif analysis_plan["type"] == "crosstab":
                # Perform cross-tabulation
                row_vars = analysis_plan.get("row_vars", [])
                col_vars = analysis_plan.get("col_vars", [])
                
                if row_vars and col_vars:
                    table = pd.crosstab(
                        [context.dataset[var] for var in row_vars],
                        [context.dataset[var] for var in col_vars],
                        margins=True
                    )
                    
                    results["table"] = {
                        "data": table.to_dict(),
                        "original_index": table.index.tolist(),
                        "original_columns": table.columns.tolist()
                    }
                    
                    # Perform statistical tests if requested
                    if analysis_plan.get("statistical_tests"):
                        stats_results = {}
                        for test in analysis_plan["statistical_tests"]:
                            if test == "chi-square":
                                chi2, p, dof, expected = stats.chi2_contingency(table.iloc[:-1, :-1])
                                stats_results["chi_square"] = {
                                    "statistic": float(chi2),
                                    "p_value": float(p),
                                    "degrees_of_freedom": int(dof),
                                    "significant": p < 0.05,
                                    "significance": "significant" if p < 0.05 else "not significant"
                                }
                        results["statistics"] = stats_results
            
            # Generate explanation
            explanation = self._generate_explanation(analysis_plan, results)
            
            # Return formatted response
            return {
                "type": analysis_plan["type"],
                "variables": analysis_plan["variables"],
                "descriptive_stats": results.get("descriptive_stats", {}),
                "distribution": results.get("distribution"),
                "table": results.get("table"),
                "statistics": results.get("statistics", {}),
                "explanation": explanation,
                "visualization": analysis_plan.get("visualization"),
                "questions_used": [query]
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_crosstab: {str(e)}")
            raise Exception(f"Error in analysis: {str(e)}")
    
    def _get_analysis_plan(self, query: str, context: AnalysisContext) -> Dict[str, Any]:
        """
        Get an analysis plan from the LLM based on the user's query and context.
        
        Args:
            query: User's query
            context: Analysis context containing dataset and metadata
            
        Returns:
            Dictionary containing the analysis plan
        """
        try:
            # Prepare context for the LLM
            variables = list(context.dataset.columns)
            
            # Detect variable types
            variable_types = {}
            for var in variables:
                series = context.dataset[var]
                unique_vals = series.nunique()
                if unique_vals <= 2:  # Binary variable
                    variable_types[var] = "binary"
                elif unique_vals <= 10:  # Categorical variable with few categories
                    variable_types[var] = "categorical"
                else:
                    variable_types[var] = "numeric"
            
            # Add variable type information to the prompt
            variable_info = "\n".join([f"- {var} ({vtype})" for var, vtype in variable_types.items()])
            
            multiple_response_info = ""
            if context.multiple_response_vars:
                multiple_response_info = "\nMultiple-response variables:\n" + "\n".join(
                    f"- {var}: {', '.join(options)}" 
                    for var, options in context.multiple_response_vars.items()
                )
            
            prompt = f"""
            You are an AI assistant specialized in data analysis. Your task is to analyze the relationship between variables in the dataset.

            Available variables and their types:
            {variable_info}
            {multiple_response_info}

            User query: {query}

            Based on the user's query and variable types, determine:
            1. Which variables to analyze
            2. What type of analysis to perform:
               - For binary/categorical variables: use "distribution" type
               - For numeric variables: use "descriptive" type
               - For relationships between variables: use "crosstab" type
            3. What statistical tests to run
            4. What visualization would be most appropriate

            Respond in the following JSON format:
            {{
                "type": "distribution" or "descriptive" or "crosstab",
                "variables": ["var1", "var2"],
                "row_vars": ["var1"],  # For crosstab only
                "col_vars": ["var2"],  # For crosstab only
                "statistical_tests": ["chi-square"],
                "visualization": "bar_chart" or "histogram" or "pie_chart"
            }}
            """
            
            # Get LLM response
            llm_response = self._call_deepseek(prompt)
            logger.info(f"Raw LLM response: {llm_response}")
            
            # Parse and validate the response
            try:
                # Extract JSON from the response
                json_str = llm_response.strip()
                if json_str.startswith("```json"):
                    json_str = json_str[7:-3].strip()
                elif json_str.startswith("```"):
                    json_str = json_str[3:-3].strip()
                plan = json.loads(json_str)
                
                # Validate required fields
                required_fields = ["type", "variables"]
                missing_fields = [field for field in required_fields if field not in plan]
                if missing_fields:
                    logger.warning(f"LLM response missing fields: {missing_fields}. Using fallback plan.")
                    return {
                        "type": "distribution",
                        "variables": [variables[0]] if variables else [],
                        "statistical_tests": [],
                        "visualization": "bar_chart"
                    }
                
                # Ensure variables is a non-empty list
                if not isinstance(plan["variables"], list) or not plan["variables"]:
                    logger.warning("LLM response has empty or invalid 'variables'. Using fallback plan.")
                    return {
                        "type": "distribution",
                        "variables": [variables[0]] if variables else [],
                        "statistical_tests": [],
                        "visualization": "bar_chart"
                    }
                
                # Override type to "distribution" for binary/categorical variables
                if len(plan["variables"]) == 1:
                    var = plan["variables"][0]
                    if var in variable_types and variable_types[var] in ["binary", "categorical"]:
                        plan["type"] = "distribution"
                        plan["visualization"] = "bar_chart"
                
                # Add row_vars and col_vars for crosstab analysis
                if plan["type"] == "crosstab" and len(plan["variables"]) >= 2:
                    plan["row_vars"] = [plan["variables"][0]]
                    plan["col_vars"] = [plan["variables"][1]]
                
                return plan
                
            except Exception as e:
                logger.error(f"Error parsing LLM response: {e}. Raw response: {llm_response}")
                # Return a default plan if parsing fails
                return {
                    "type": "distribution",
                    "variables": [variables[0]] if variables else [],
                    "statistical_tests": [],
                    "visualization": "bar_chart"
                }
                
        except Exception as e:
            logger.error(f"Error in _get_analysis_plan: {str(e)}")
            raise Exception(f"Error getting analysis plan: {str(e)}")
    
    def _generate_explanation(self, analysis_plan: Dict[str, Any], results: Dict[str, Any]) -> str:
        """
        Generate a human-readable explanation of the analysis results.
        
        Args:
            analysis_plan: The analysis plan
            results: The analysis results
            
        Returns:
            String containing the explanation
        """
        explanation = []
        
        if analysis_plan["type"] == "distribution":
            dist = results.get("distribution", {})
            if dist:
                var = analysis_plan["variables"][0]
                explanation.append(f"Distribution of {var}:")
                for value, count in dist["counts"].items():
                    pct = dist["percentages"][value]
                    explanation.append(f"- {value}: {count} ({pct}%)")
                
                # Add chi-square test results if available
                stats = results.get("statistics", {})
                if "chi_square" in stats:
                    chi2 = stats["chi_square"]
                    explanation.append(f"\nChi-square test results:")
                    explanation.append(f"- Statistic: {chi2['statistic']:.2f}")
                    explanation.append(f"- p-value: {chi2['p_value']:.4f}")
                    explanation.append(f"- Result: {chi2['significance']}")
        
        elif analysis_plan["type"] == "descriptive":
            stats = results.get("descriptive_stats", {})
            if stats:
                explanation.append(f"Descriptive statistics for {', '.join(analysis_plan['variables'])}:")
                explanation.append(f"- Count: {stats['count']:.0f}")
                explanation.append(f"- Mean: {stats['mean']:.2f}")
                explanation.append(f"- Standard Deviation: {stats['std']:.2f}")
                explanation.append(f"- Range: {stats['min']:.2f} to {stats['max']:.2f}")
        
        elif analysis_plan["type"] == "crosstab":
            explanation.append(f"Cross-tabulation analysis:")
            explanation.append(f"- Row variables: {', '.join(analysis_plan.get('row_vars', []))}")
            explanation.append(f"- Column variables: {', '.join(analysis_plan.get('col_vars', []))}")
            
            stats = results.get("statistics", {})
            if "chi_square" in stats:
                chi2 = stats["chi_square"]
                explanation.append(f"\nChi-square test results:")
                explanation.append(f"- Statistic: {chi2['statistic']:.2f}")
                explanation.append(f"- p-value: {chi2['p_value']:.4f}")
                explanation.append(f"- Result: {chi2['significance']}")
        
        return "\n".join(explanation)

    async def _execute_crosstab(self, analysis_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a crosstab analysis based on the analysis plan."""
        try:
            # Extract parameters from analysis plan
            file_path = analysis_plan.get("file_path")
            if not file_path:
                raise ValueError("File path is required for crosstab analysis")
            
            # Load the data
            df = self._load_data(file_path)
            
            # Get row and column variables
            row_vars = analysis_plan.get("row_vars", [])
            col_vars = analysis_plan.get("col_vars", [])
            
            # Get multiple response configuration if present
            multiple_response = analysis_plan.get("multiple_response", {})
            
            # Create binary columns for multiple response variables
            if multiple_response:
                for var, config in multiple_response.items():
                    if config["type"] == "select_all":
                        options = config["options"]
                        for option in options:
                            binary_col = f"{var}_{option}"
                            df[binary_col] = df[var].apply(lambda x: 1 if option in str(x).split(',') else 0)
            
            # Create crosstab
            if multiple_response:
                cts = []
                for var, config in multiple_response.items():
                    if config["type"] == "select_all":
                        options = config["options"]
                        for option in options:
                            binary_col = f"{var}_{option}"
                            if var in row_vars:
                                # Create a temporary DataFrame with the binary column
                                temp_df = pd.DataFrame({
                                    binary_col: df[binary_col],
                                    **{col: df[col] for col in col_vars}
                                })
                                # Create crosstab with the binary column
                                ct_part = pd.crosstab(
                                    temp_df[binary_col],
                                    [temp_df[col] for col in col_vars],
                                    dropna=False
                                )
                                # Use the binary column name directly as the index
                                ct_part.index = pd.Index([binary_col], name=var)
                                cts.append(ct_part)
                            elif var in col_vars:
                                # Create a temporary DataFrame with the binary column
                                temp_df = pd.DataFrame({
                                    **{col: df[col] for col in row_vars},
                                    binary_col: df[binary_col]
                                })
                                # Create crosstab with the binary column
                                ct_part = pd.crosstab(
                                    [temp_df[col] for col in row_vars],
                                    temp_df[binary_col],
                                    dropna=False
                                )
                                # Use the binary column name directly as the column
                                ct_part.columns = pd.Index([binary_col], name=var)
                                cts.append(ct_part)
                ct = pd.concat(cts, axis=0 if var in row_vars else 1)
            else:
                ct = pd.crosstab(
                    [df[v] for v in row_vars],
                    [df[v] for v in col_vars],
                    dropna=False
                )
            
            # Convert to the expected response format
            result = {
                'results': {
                    'table': {
                        'data': ct.to_dict(),
                        'index_name': ct.index.name,
                        'column_names': [name for name in ct.columns.names if name],
                        'original_index': ct.index.tolist(),
                        'original_columns': ct.columns.tolist()
                    }
                }
            }
            
            # Add multiple response configuration if present
            if multiple_response:
                result['results']['multiple_response'] = multiple_response
            
            return result
        except Exception as e:
            logger.error(f"Error executing crosstab analysis: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def _convert_crosstab_to_dict(self, ct: pd.DataFrame) -> Dict[str, Any]:
        """Convert a pandas crosstab to a dictionary format."""
        try:
            # Convert index and columns to strings
            ct.index = ct.index.astype(str)
            ct.columns = ct.columns.astype(str)
            
            # Convert to dictionary
            result = {
                'data': ct.to_dict(),
                'row_labels': ct.index.tolist(),
                'column_labels': ct.columns.tolist(),
                'shape': ct.shape
            }
            
            return result
        except Exception as e:
            logger.error(f"Error converting crosstab to dictionary: {str(e)}")
            raise ValueError(f"Error converting crosstab to dictionary: {str(e)}")

    def _load_data(self, file_path: str) -> pd.DataFrame:
        """Load data from file with proper encoding handling."""
        try:
            if file_path.endswith('.sav'):
                # Try multiple encodings for SPSS files
                encodings = ['latin1', 'cp1252', 'iso-8859-1', 'utf-8']
                last_error = None
                
                for encoding in encodings:
                    try:
                        logger.info(f"Attempting to read SPSS file with {encoding} encoding")
                        import pyreadstat
                        df, meta = pyreadstat.read_sav(file_path, encoding=encoding)
                        logger.info(f"Successfully read SPSS file with {encoding} encoding")
                        return df
                    except Exception as e:
                        last_error = e
                        logger.warning(f"Failed to read with {encoding} encoding: {str(e)}")
                        continue
                
                # If all encodings fail, raise the last error
                raise ValueError(f"Failed to read SPSS file with any encoding. Last error: {str(last_error)}")
            elif file_path.endswith('.csv'):
                return pd.read_csv(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_path}")
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise ValueError(f"Error loading data: {str(e)}") 