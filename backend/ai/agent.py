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
    
    def analyze_crosstab(self, context: AnalysisContext, user_query: str) -> Dict[str, Any]:
        """
        Analyze cross-tabulation based on user query and context.
        
        Args:
            context: Current analysis context including dataset and metadata
            user_query: User's natural language query
            
        Returns:
            Dictionary with analysis results and explanation
        """
        try:
            # Prepare context for the LLM
            context_prompt = self._prepare_context_prompt(context, user_query)
            logger.info(f"Prompt sent to LLM: {context_prompt}")
            
            # Track questions used
            if not hasattr(context, 'analysis_history') or context.analysis_history is None:
                context.analysis_history = []
            context.analysis_history.append({"question": user_query})
            
            # Get LLM response
            llm_response = self._call_deepseek(context_prompt)
            logger.info(f"Raw LLM response: {llm_response}")
            
            # Parse and validate the response
            analysis_plan = self._parse_llm_response(llm_response)
            logger.info(f"Parsed analysis plan: {analysis_plan}")
            
            # Execute the analysis
            results = self._execute_analysis(context, analysis_plan)
            logger.info(f"Analysis results: {results}")
            
            return results
        except Exception as e:
            logger.error(f"Error in analyze_crosstab: {str(e)}")
            raise
    
    def _prepare_context_prompt(self, context: AnalysisContext, user_query: str) -> str:
        """Prepare the context prompt for the LLM."""
        variables = list(context.dataset.columns)
        multiple_response_info = ""
        if context.multiple_response_vars:
            multiple_response_info = "\nMultiple-response variables:\n" + "\n".join(
                f"- {var}: {', '.join(options)}" 
                for var, options in context.multiple_response_vars.items()
            )
        
        prompt = f"""
        You are an AI assistant specialized in cross-tabulation analysis. Your task is to analyze the relationship between variables in the dataset.

        Available variables: {variables}
        {multiple_response_info}

        User query: {user_query}

        Based on the user's query, determine:
        1. Which variables to analyze
        2. What type of analysis to perform (crosstab, descriptive stats)
        3. What statistical tests to run
        4. What visualization would be most appropriate

        Respond in the following JSON format:
        {{
            "type": "crosstab" or "descriptive",
            "variables": ["var1", "var2"],
            "statistical_tests": ["chi-square"],
            "visualization": "bar_chart"
        }}
        """
        return prompt
    
    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """Parse the LLM response into an analysis plan, robust to missing or empty fields."""
        try:
            # Extract JSON from the response
            json_str = response.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:-3].strip()
            elif json_str.startswith("```"):
                json_str = json_str[3:-3].strip()
            plan = json.loads(json_str)

            # Validate required fields
            required_fields = ["type", "variables"]
            missing_fields = [field for field in required_fields if field not in plan]
            if missing_fields:
                logger.warning(f"LLM response missing fields: {missing_fields}. Using fallback plan. Raw: {response}")
                return {
                    "type": "crosstab",
                    "variables": ["var1", "var2"],
                    "statistical_tests": ["chi-square"],
                    "visualization": "bar_chart"
                }
            # Ensure variables is a non-empty list
            if not isinstance(plan["variables"], list) or not plan["variables"]:
                logger.warning(f"LLM response has empty or invalid 'variables'. Using fallback plan. Raw: {response}")
                return {
                    "type": "crosstab",
                    "variables": ["var1", "var2"],
                    "statistical_tests": ["chi-square"],
                    "visualization": "bar_chart"
                }
            return plan
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}. Raw response: {response}")
            # Return a default plan if parsing fails
            return {
                "type": "crosstab",
                "variables": ["var1", "var2"],
                "statistical_tests": ["chi-square"],
                "visualization": "bar_chart"
            }
    
    def _execute_analysis(self, context: AnalysisContext, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the analysis based on the plan."""
        try:
            if plan["type"] == "crosstab":
                # Handle multiple response variables
                multiple_response = {}
                if context.multiple_response_vars:
                    for var, options in context.multiple_response_vars.items():
                        if var in plan["variables"]:
                            multiple_response[var] = {
                                "type": "select_all",
                                "options": options
                            }
                
                # Map variable names if needed
                mapped_vars = []
                for var in plan["variables"]:
                    if var == "income_level":
                        mapped_vars.append("income")
                    else:
                        mapped_vars.append(var)
                
                # Ensure we have a valid file path
                if not context.file_path:
                    raise ValueError("No file path provided in context")
                
                # Create crosstab request
                from routers.analyze import analyze_crosstab, CrosstabRequest
                
                # Use only the first two variables for the crosstab
                row_vars = [mapped_vars[0]] if mapped_vars else []
                col_vars = [mapped_vars[1]] if len(mapped_vars) > 1 else []
                
                if not row_vars or not col_vars:
                    raise ValueError("Need at least two variables for crosstab analysis")
                
                request = CrosstabRequest(
                    file_path=context.file_path,
                    row_vars=row_vars,
                    col_vars=col_vars,
                    statistics=plan.get("statistical_tests", ["chi-square"]),
                    display={"row_pct": True, "col_pct": True},
                    significance={"enable": True},
                    multiple_response=multiple_response
                )
                
                # Execute crosstab
                result = analyze_crosstab(request)
                logger.info(f"Received crosstab result: {result}")
                
                # Add statistical tests if requested
                if "chi-square" in plan.get("statistical_tests", []):
                    try:
                        # Convert crosstab to numpy array for statistical tests
                        ct_data = pd.DataFrame(result["table"]["data"]).values
                        chi2_results = chi_square(ct_data)
                        chi2_results = mark_significance(chi2_results)
                        
                        # Ensure the statistics key exists
                        if "statistics" not in result:
                            result["statistics"] = {}
                        
                        # Add chi-square results with the correct key and convert numpy types
                        result["statistics"]["chi_square"] = {
                            "statistic": float(chi2_results["chi2"]),
                            "p_value": float(chi2_results["p_value"]),
                            "degrees_of_freedom": int(chi2_results["dof"]),
                            "significant": bool(chi2_results["significant"]),
                            "significance": str(chi2_results.get("significance", "ns"))
                        }
                        
                        logger.info(f"Added chi-square results: {result['statistics']['chi_square']}")
                    except Exception as e:
                        logger.error(f"Error calculating chi-square test: {str(e)}")
                        raise
                
                # Add multiple response info to results
                if multiple_response:
                    result["multiple_response"] = multiple_response
                
                # Generate explanation
                explanation = self._explain_crosstab(result)
                
                # Create the response dictionary with converted types
                response_dict = {
                    "analysis_type": str(plan["type"]),
                    "variables": [str(v) for v in [row_vars[0], col_vars[0]]],  # Use only the variables used in the crosstab
                    "results": self._to_native(result),
                    "explanation": str(explanation),
                    "visualization_suggestion": str(plan.get("visualization")) if plan.get("visualization") else None,
                    "questions_used": [str(q["question"]) for q in context.analysis_history if "question" in q],
                    "columns_used": [str(v) for v in [row_vars[0], col_vars[0]]]  # Use only the variables used in the crosstab
                }
                
                logger.info(f"Created response dictionary: {response_dict}")
                return response_dict
            elif plan["type"] == "descriptive":
                return self._execute_descriptive(context, plan)
            else:
                raise ValueError(f"Unsupported analysis type: {plan['type']}")
        except Exception as e:
            logger.error(f"Error executing analysis: {str(e)}. Plan: {plan}")
            raise
    
    def _to_native(self, obj):
        """Recursively convert numpy types to native Python types."""
        if isinstance(obj, dict):
            return {k: self._to_native(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._to_native(v) for v in obj]
        elif isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return obj
    
    def _execute_descriptive(self, context: AnalysisContext, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute descriptive statistics analysis, robust to non-numeric columns."""
        var = plan["variables"][0]
        series = context.dataset[var]
        if pd.api.types.is_numeric_dtype(series):
            stats = series.describe()
            return {"descriptive_stats": self._to_native(stats.to_dict())}
        else:
            # For non-numeric columns, return count, unique, top, freq
            logger.warning(f"Descriptive stats requested for non-numeric column '{var}'. Returning count, unique, top, freq.")
            desc = series.describe()
            result = {k: desc[k] for k in ["count", "unique", "top", "freq"] if k in desc}
            return {"descriptive_stats": self._to_native(result)}
    
    def _generate_explanation(self, results: Dict[str, Any], plan: Dict[str, Any]) -> str:
        """Generate a natural language explanation of the results."""
        if plan["type"] == "crosstab":
            return self._explain_crosstab(results)
        elif plan["type"] == "descriptive":
            # If the descriptive stats are for a non-numeric column, do not mention visualization
            stats = results.get("descriptive_stats", {})
            if all(k in stats for k in ["count", "unique", "top", "freq"]) and len(stats) == 4:
                return (
                    f"I've analyzed the descriptive statistics for the variable. Here's what I found:\n\n"
                    f"- Count: {stats['count']}\n"
                    f"- Unique: {stats['unique']}\n"
                    f"- Most common value: {stats['top']}\n"
                    f"- Frequency of most common: {stats['freq']}\n"
                )
            else:
                return self._explain_descriptive(results)
        else:
            return "Analysis completed successfully."
    
    def _explain_crosstab(self, results: Dict[str, Any]) -> str:
        """Generate explanation for cross-tabulation results."""
        try:
            # Handle both dictionary and AgentResponse results
            if isinstance(results, AgentResponse):
                results_dict = results.results
            else:
                results_dict = results
                
            chi2 = results_dict.get("statistics", {}).get("chi_square", {})
            if not chi2:
                return "Cross-tabulation analysis completed. No statistical tests were performed."
            
            significance = "statistically significant" if chi2.get("p_value", 1.0) < 0.05 else "not statistically significant"
            
            return f"""
            I've analyzed the relationship between the variables. Here's what I found:
            
            The cross-tabulation shows the distribution of values across the categories.
            The chi-square test results indicate that the relationship is {significance}:
            - Chi-square statistic: {chi2.get('statistic', 0):.2f}
            - P-value: {chi2.get('p_value', 1.0):.4f}
            - Degrees of freedom: {chi2.get('degrees_of_freedom', 0)}
            
            Click the "View Visualization" button to see the detailed results.
            """
        except Exception as e:
            logger.error(f"Error generating crosstab explanation: {str(e)}")
            return "Analysis completed. View the visualization for detailed results."
    
    def _explain_descriptive(self, results: Dict[str, Any]) -> str:
        """Generate explanation for descriptive statistics."""
        stats = results["descriptive_stats"]
        return f"""
        I've analyzed the descriptive statistics for the variable. Here's what I found:
        
        - Mean: {stats['mean']:.2f}
        - Standard Deviation: {stats['std']:.2f}
        - Minimum: {stats['min']:.2f}
        - Maximum: {stats['max']:.2f}
        
        Click the "View Visualization" button to see the detailed distribution.
        """

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