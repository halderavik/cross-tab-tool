from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from scipy import stats
import pyreadstat
import logging
import os
from app.core.data_processor import DataProcessor

logger = logging.getLogger(__name__)

def load_spss_file(file_path: str) -> pd.DataFrame:
    """Load SPSS file with multiple encoding attempts."""
    encodings = ['latin1', 'cp1252', 'iso-8859-1', 'utf-8']
    last_error = None
    
    for encoding in encodings:
        try:
            logger.info(f"Attempting to read SPSS file with {encoding} encoding")
            df, meta = pyreadstat.read_sav(file_path, encoding=encoding)
            logger.info(f"Successfully read SPSS file with {encoding} encoding")
            return df
        except Exception as e:
            last_error = e
            logger.warning(f"Failed to read with {encoding} encoding: {str(e)}")
            continue
    
    raise ValueError(f"Failed to read SPSS file with any encoding. Last error: {str(last_error)}")

router = APIRouter()

class CrosstabRequest(BaseModel):
    file_path: str
    row_vars: List[str]
    col_vars: List[str]
    statistics: List[str]
    display: Dict[str, bool]
    significance: Dict[str, Any]
    decimal_places: int
    missing: str
    hide_empty: bool
    custom_variables: Optional[List[Dict[str, Any]]] = None

class CrosstabResponse(BaseModel):
    table: Dict[str, Any]
    statistics: Dict[str, Any]
    message: str

@router.post("/analyze-crosstab", response_model=CrosstabResponse)
async def analyze_crosstab(request: CrosstabRequest):
    try:
        # Load the data
        file_ext = os.path.splitext(request.file_path)[1].lower()
        if file_ext == '.sav':
            df = load_spss_file(request.file_path)
        else:
            df = pd.read_csv(request.file_path)
        
        logger.info(f"Successfully loaded data. Shape: {df.shape}")
        
        # Process custom variables if any
        if request.custom_variables:
            for variable in request.custom_variables:
                # Create a mask for each condition
                masks = []
                for condition in variable['conditions']:
                    col = df[condition['column']]
                    
                    if condition['comparison'] == 'equals':
                        mask = col == condition['value']
                    elif condition['comparison'] == 'contains':
                        mask = col.astype(str).str.contains(condition['value'], case=False)
                    elif condition['comparison'] == 'greater_than':
                        mask = col > float(condition['value'])
                    elif condition['comparison'] == 'less_than':
                        mask = col < float(condition['value'])
                    
                    masks.append(mask)
                
                # Combine masks based on operators
                final_mask = masks[0]
                for i in range(1, len(masks)):
                    if variable['conditions'][i]['operator'] == 'AND':
                        final_mask = final_mask & masks[i]
                    else:  # OR
                        final_mask = final_mask | masks[i]
                
                # Create the new variable
                df[variable['name']] = np.where(final_mask, 1, 0)
        
        # Handle missing values
        if request.missing == 'exclude':
            df = df.dropna(subset=request.row_vars + request.col_vars)
        
        # Create cross-tabulation
        table = pd.crosstab(
            [df[var] for var in request.row_vars],
            [df[var] for var in request.col_vars],
            margins=True
        )
        
        # Calculate statistics
        stats_results = {}
        if 'chi-square' in request.statistics:
            chi2, p, dof, expected = stats.chi2_contingency(table.iloc[:-1, :-1])
            stats_results['chi-square'] = {
                'statistic': round(chi2, request.decimal_places),
                'p-value': round(p, request.decimal_places),
                'degrees_of_freedom': dof
            }
        
        if 'phi-cramer' in request.statistics:
            n = table.iloc[:-1, :-1].sum().sum()
            min_dim = min(table.shape) - 1
            phi = np.sqrt(chi2 / n)
            cramer = np.sqrt(chi2 / (n * min_dim))
            stats_results['phi-cramer'] = {
                'phi': round(phi, request.decimal_places),
                'cramer_v': round(cramer, request.decimal_places)
            }
        
        if 'contingency' in request.statistics:
            n = table.iloc[:-1, :-1].sum().sum()
            contingency = np.sqrt(chi2 / (chi2 + n))
            stats_results['contingency'] = {
                'coefficient': round(contingency, request.decimal_places)
            }
        
        # Format the table
        formatted_table = {
            'data': table.to_dict(),
            'row_labels': table.index.tolist(),
            'column_labels': table.columns.tolist(),
            'display': request.display
        }
        
        return CrosstabResponse(
            table=formatted_table,
            statistics=stats_results,
            message="Analysis completed successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing cross-tabulation: {str(e)}"
        ) 