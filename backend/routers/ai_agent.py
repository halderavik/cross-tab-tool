"""
API router for AI agent endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import pandas as pd
import os
import logging

from ai.agent import CrossTabAgent, AnalysisContext, AgentResponse
from models import UploadedFile
from database import SessionLocal, get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["ai_agent"])

class AgentQuery(BaseModel):
    """Query for the AI agent."""
    file_id: int
    query: str
    context: Optional[Dict[str, Any]] = None

# Initialize the agent with the API key
agent = CrossTabAgent(api_key="sk-30635e2010e44c40a5cc9f5a4566e3d5")

@router.post("/analyze", response_model=AgentResponse)
async def analyze_with_agent(
    query: AgentQuery,
    db: Session = Depends(get_db)
) -> AgentResponse:
    """
    Analyze data using the AI agent.
    
    Args:
        query: The user's query and context
        db: Database session
        
    Returns:
        AgentResponse with analysis results
    """
    try:
        # Get the uploaded file
        file = db.query(UploadedFile).filter(UploadedFile.id == query.file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Load the dataset using the agent's _load_data method
        try:
            if file.indexed_path and os.path.exists(file.indexed_path):
                dataset = pd.read_parquet(file.indexed_path)
            else:
                dataset = agent._load_data(file.filepath)
            logger.info(f"Successfully loaded dataset. Shape: {dataset.shape}")
        except Exception as e:
            logger.error(f"Error loading dataset: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error loading dataset: {str(e)}")
        
        # Get variable metadata
        variable_metadata = {
            col: {
                "type": str(dataset[col].dtype),
                "unique_values": len(dataset[col].unique()),
                "missing_values": dataset[col].isnull().sum()
            }
            for col in dataset.columns
        }
        
        # Create analysis context
        context = AnalysisContext(
            dataset=dataset,
            variable_metadata=variable_metadata,
            current_analysis=query.context,
            file_path=file.filepath,
            multiple_response_vars=query.context.get('multiple_response_vars') if query.context else None
        )
        
        # Get analysis from agent
        try:
            response_dict = agent.analyze_crosstab(context, query.query)
            logger.info(f"Successfully generated analysis response: {response_dict}")
            
            # Format the response according to AgentResponse interface
            formatted_response = {
                "analysis_type": response_dict.get("type", "descriptive"),
                "variables": response_dict.get("variables", []),
                "results": {
                    "descriptive_stats": response_dict.get("descriptive_stats", {}),
                    "table": response_dict.get("table"),
                    "statistics": response_dict.get("statistics", {})
                },
                "explanation": response_dict.get("explanation", "Analysis completed successfully."),
                "visualization_suggestion": response_dict.get("visualization"),
                "questions_used": response_dict.get("questions_used", []),
                "columns_used": response_dict.get("variables", [])
            }
            
            # Convert dictionary to AgentResponse
            response = AgentResponse(**formatted_response)
            logger.info(f"Converted to AgentResponse: {response}")
            
            return response
        except Exception as e:
            logger.error(f"Error in analysis: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error in analysis: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in analyze_with_agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}") 