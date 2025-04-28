"""
API router for AI agent endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import pandas as pd
import os

from ai.agent import CrossTabAgent, AnalysisContext, AgentResponse
from models import UploadedFile
from database import SessionLocal, get_db
from sqlalchemy.orm import Session

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
    # Get the uploaded file
    file = db.query(UploadedFile).filter(UploadedFile.id == query.file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Load the dataset
    try:
        if file.indexed_path and os.path.exists(file.indexed_path):
            dataset = pd.read_parquet(file.indexed_path)
        else:
            if file.file_type == 'SPSS':
                dataset = pd.read_spss(file.filepath)
            elif file.file_type == 'CSV':
                dataset = pd.read_csv(file.filepath)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.file_type}")
    except Exception as e:
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
        current_analysis=query.context
    )
    
    # Get analysis from agent
    try:
        response = agent.analyze_crosstab(context, query.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in analysis: {str(e)}") 