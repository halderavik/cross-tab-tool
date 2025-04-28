from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from scipy.stats import chi2_contingency
import logging
import os
import pyreadstat

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])

class CrosstabRequest(BaseModel):
    file_path: str
    row_vars: List[str]
    col_vars: List[str]
    statistics: List[str] = Field(default_factory=list)  # e.g. ["chi-square", "phi-cramer", "contingency"]
    display: Dict[str, Any] = Field(default_factory=dict)  # e.g. {"row_pct": True, ...}
    significance: Dict[str, Any] = Field(default_factory=dict)  # e.g. {"enable": True, "level": 0.05}
    decimal_places: int = 1
    missing: str = "exclude"  # or "include"
    hide_empty: bool = False

@router.post("/analyze-crosstab")
def analyze_crosstab(req: CrosstabRequest):
    try:
        logger.info(f"Received crosstab request for file: {req.file_path}")
        logger.info(f"Row variables: {req.row_vars}")
        logger.info(f"Column variables: {req.col_vars}")
        
        # Validate file exists
        if not os.path.exists(req.file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")
            
        # Load data
        try:
            if req.file_path.endswith('.sav'):
                df, _ = pyreadstat.read_sav(req.file_path)
            else:
                df = pd.read_csv(req.file_path)
            logger.info(f"Successfully loaded data. Shape: {df.shape}")
        except Exception as e:
            logger.error(f"Error loading data file: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error loading data file: {str(e)}")
            
        # Validate variables exist in data
        missing_vars = [v for v in req.row_vars + req.col_vars if v not in df.columns]
        if missing_vars:
            raise HTTPException(status_code=400, detail=f"Variables not found in data: {missing_vars}")
            
        # Use only selected variables for analysis
        selected_vars = list(set(req.row_vars + req.col_vars))
        df = df[selected_vars]
        logger.info(f"Subset data shape for selected variables: {df.shape}")

        # Do NOT drop any rows for missing values
        # if req.missing == "exclude":
        #     df = df.dropna(subset=req.row_vars + req.col_vars)
        #     logger.info(f"After dropping missing values, shape: {df.shape}")
            
        # Create crosstab (fully dynamic, robust to missing values)
        try:
            ct = pd.crosstab(
                index=[df[v] for v in req.row_vars],
                columns=[df[v] for v in req.col_vars],
                dropna=False  # Always include all combinations, even with NaN
            )
            logger.info(f"Crosstab created. Shape: {ct.shape}")
            # Drop all-zero rows and columns
            before_shape = ct.shape
            ct = ct.loc[(ct != 0).any(axis=1), (ct != 0).any(axis=0)]
            after_shape = ct.shape
            dropped_zeros = before_shape != after_shape
            logger.info(f"Crosstab after dropping zero-frequency rows/cols: {ct.shape}")
            if ct.shape == (0, 0):
                raise HTTPException(status_code=400, detail="All combinations have zero frequency. No valid data to display after dropping zero-frequency rows/columns.")
        except Exception as e:
            logger.error(f"Error creating crosstab: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error creating crosstab: {str(e)}")
            
        # Hide empty rows/cols if requested
        if req.hide_empty:
            ct = ct.loc[(ct != 0).any(axis=1), (ct != 0).any(axis=0)]
            logger.info(f"After hiding empty rows/cols, shape: {ct.shape}")
            
        # Calculate percentages
        pct_tables = {}
        try:
            row_pct = req.display.get("row_pct", False)
            col_pct = req.display.get("col_pct", False)
            total_pct = req.display.get("total_pct", False)
            
            if row_pct:
                pct_tables["row_pct"] = (ct.div(ct.sum(axis=1), axis=0) * 100).round(req.decimal_places).replace(np.nan, 0)
            if col_pct:
                pct_tables["col_pct"] = (ct.div(ct.sum(axis=0), axis=1) * 100).round(req.decimal_places).replace(np.nan, 0)
            if total_pct:
                pct_tables["total_pct"] = (ct / ct.values.sum() * 100).round(req.decimal_places).replace(np.nan, 0)
        except Exception as e:
            logger.error(f"Error calculating percentages: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error calculating percentages: {str(e)}")
            
        # Calculate statistics
        stats = {}
        try:
            if "chi-square" in req.statistics or req.significance.get("enable", False):
                chi2, p, dof, expected = chi2_contingency(ct)
                stats["chi_square"] = {"chi2": chi2, "p": p, "dof": dof}
                
                # Calculate additional statistics
                n = ct.values.sum()
                phi = np.sqrt(chi2 / n) if min(ct.shape) == 2 else None
                cramer_v = np.sqrt(chi2 / (n * (min(ct.shape) - 1))) if min(ct.shape) > 1 else None
                contingency = np.sqrt(chi2 / (chi2 + n))
                
                if "phi-cramer" in req.statistics:
                    stats["phi"] = phi
                    stats["cramers_v"] = cramer_v
                if "contingency" in req.statistics:
                    stats["contingency_coefficient"] = contingency
        except Exception as e:
            logger.error(f"Error calculating statistics: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error calculating statistics: {str(e)}")
            
        # Format output
        try:
            def convert_index_keys(d):
                # Recursively convert tuple/list keys to strings for JSON serialization
                if isinstance(d, dict):
                    return {str(k): convert_index_keys(v) for k, v in d.items()}
                return d

            table_dict = convert_index_keys(ct.round(req.decimal_places).astype(float).replace(np.nan, 0).to_dict())
            percentages_dict = {k: convert_index_keys(v.to_dict()) for k, v in pct_tables.items()}
            result = {
                "table": table_dict,
                "percentages": percentages_dict,
                "stats": stats,
                "dropped_zero_rows_cols": dropped_zeros
            }
            logger.info("Successfully completed crosstab analysis")
            return result
        except Exception as e:
            logger.error(f"Error formatting output: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error formatting output: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in crosstab analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}") 