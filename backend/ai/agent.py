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

logger = logging.getLogger(__name__)

class AnalysisContext(BaseModel):
    """Context for the AI agent's analysis."""
    model_config = {
        "arbitrary_types_allowed": True
    }
    
    dataset: pd.DataFrame
    variable_metadata: Dict[str, Dict[str, Any]]
    current_analysis: Optional[Dict[str, Any]] = None
    analysis_history: List[Dict[str, Any]] = Field(default_factory=list)

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
    
    def analyze_crosstab(self, context: AnalysisContext, user_query: str) -> AgentResponse:
        """
        Analyze cross-tabulation based on user query and context.
        
        Args:
            context: Current analysis context including dataset and metadata
            user_query: User's natural language query
            
        Returns:
            AgentResponse with analysis results and explanation
        """
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
        
        # Generate explanation
        explanation = self._generate_explanation(results, analysis_plan)
        
        # Only suggest visualization if appropriate
        vis_suggestion = None
        if analysis_plan["type"] == "crosstab":
            vis_suggestion = analysis_plan.get("visualization")
        elif analysis_plan["type"] == "descriptive":
            var = analysis_plan["variables"][0]
            series = context.dataset[var]
            if pd.api.types.is_numeric_dtype(series):
                vis_suggestion = analysis_plan.get("visualization")
        
        # Extract all questions used
        questions_used = [q["question"] for q in context.analysis_history if "question" in q]
        
        return AgentResponse(
            analysis_type=analysis_plan["type"],
            variables=analysis_plan["variables"],
            results=results,
            explanation=explanation,
            visualization_suggestion=vis_suggestion,
            questions_used=questions_used,
            columns_used=analysis_plan["variables"]
        )
    
    def _prepare_context_prompt(self, context: AnalysisContext, user_query: str) -> str:
        """Prepare the context prompt for the LLM."""
        variables = list(context.variable_metadata.keys())
        prompt = f"""
        You are an AI assistant specialized in cross-tabulation analysis. Your task is to analyze the relationship between variables in the dataset.

        Available variables: {variables}

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
        """Execute the analysis plan on the dataset."""
        try:
            if plan["type"] == "crosstab":
                return self._execute_crosstab(context, plan)
            elif plan["type"] == "descriptive":
                return self._execute_descriptive(context, plan)
            else:
                raise ValueError(f"Unsupported analysis type: {plan['type']}")
        except Exception as e:
            logger.error(f"Error executing analysis: {e}. Plan: {plan}")
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
    
    def _execute_crosstab(self, context: AnalysisContext, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute cross-tabulation analysis."""
        var1, var2 = plan["variables"]
        crosstab = pd.crosstab(context.dataset[var1], context.dataset[var2])
        
        # Calculate chi-square
        chi2, p, dof, expected = stats.chi2_contingency(crosstab)
        
        result = {
            "crosstab": crosstab.to_dict(),
            "chi_square": {
                "statistic": chi2,
                "p_value": p,
                "degrees_of_freedom": dof
            }
        }
        return self._to_native(result)
    
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
        chi2 = results["chi_square"]
        significance = "statistically significant" if chi2["p_value"] < 0.05 else "not statistically significant"
        
        return f"""
        I've analyzed the relationship between the variables. Here's what I found:
        
        The cross-tabulation shows the distribution of values across the categories.
        The chi-square test results indicate that the relationship is {significance}:
        - Chi-square statistic: {chi2['statistic']:.2f}
        - P-value: {chi2['p_value']:.4f}
        - Degrees of freedom: {chi2['degrees_of_freedom']}
        
        Click the "View Visualization" button to see the detailed results.
        """
    
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