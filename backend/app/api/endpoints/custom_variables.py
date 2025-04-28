from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Optional
import pandas as pd
import numpy as np
from ..core.data_processor import DataProcessor

router = APIRouter()

class Condition(BaseModel):
    id: str
    operator: Literal['AND', 'OR']
    column: str
    value: str
    comparison: Literal['equals', 'contains', 'greater_than', 'less_than']

class CustomVariable(BaseModel):
    name: str
    label: str
    conditions: List[Condition]

class CustomVariableRequest(BaseModel):
    file_path: str
    custom_variables: List[CustomVariable]

class CustomVariableResponse(BaseModel):
    success: bool
    message: str
    processed_variables: List[str]

@router.post("/process-custom-variables", response_model=CustomVariableResponse)
async def process_custom_variables(request: CustomVariableRequest):
    try:
        # Load the data
        data_processor = DataProcessor()
        df = data_processor.load_data(request.file_path)
        
        processed_variables = []
        
        for variable in request.custom_variables:
            # Create a mask for each condition
            masks = []
            for condition in variable.conditions:
                col = df[condition.column]
                
                if condition.comparison == 'equals':
                    mask = col == condition.value
                elif condition.comparison == 'contains':
                    mask = col.astype(str).str.contains(condition.value, case=False)
                elif condition.comparison == 'greater_than':
                    mask = col > float(condition.value)
                elif condition.comparison == 'less_than':
                    mask = col < float(condition.value)
                
                masks.append(mask)
            
            # Combine masks based on operators
            final_mask = masks[0]
            for i in range(1, len(masks)):
                if variable.conditions[i].operator == 'AND':
                    final_mask = final_mask & masks[i]
                else:  # OR
                    final_mask = final_mask | masks[i]
            
            # Create the new variable
            df[variable.name] = np.where(final_mask, 1, 0)
            processed_variables.append(variable.name)
        
        # Save the processed data
        data_processor.save_data(df, request.file_path)
        
        return CustomVariableResponse(
            success=True,
            message="Custom variables processed successfully",
            processed_variables=processed_variables
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing custom variables: {str(e)}"
        ) 