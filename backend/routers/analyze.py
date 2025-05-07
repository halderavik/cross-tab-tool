from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from scipy.stats import chi2_contingency
import logging
import os
import pyreadstat
from processors.statistical_tests import chi_square, fisher_exact, mark_significance

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])

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
    weight_var: Optional[str] = None  # column name for weights
    subgroup: Optional[Dict[str, Any]] = None  # {column: value or [values]}
    multiple_response: Optional[Dict[str, Any]] = None  # {variable: {"type": "select_all", "options": [...]}}

@router.post("/analyze-crosstab")
def analyze_crosstab(req: CrosstabRequest) -> Dict[str, Any]:
    """Analyze cross-tabulation based on request."""
    logger.info(f"Received crosstab request for file: {req.file_path}")
    logger.info(f"Row variables: {req.row_vars}")
    logger.info(f"Column variables: {req.col_vars}")
    logger.info(f"Weight variable: {req.weight_var}")
    logger.info(f"Subgroup: {req.subgroup}")
    logger.info(f"Multiple response: {req.multiple_response}")
    
    # Load data
    try:
        file_ext = os.path.splitext(req.file_path)[1].lower()
        if file_ext == '.sav':
            df = load_spss_file(req.file_path)
            logger.info(f"Successfully loaded SPSS data. Shape: {df.shape}")
        else:
            df = pd.read_csv(req.file_path)
            logger.info(f"Successfully loaded CSV data. Shape: {df.shape}")
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error loading data: {str(e)}")
    
    # Handle multiple response variables
    if req.multiple_response:
        for var, config in req.multiple_response.items():
            if config["type"] == "select_all":
                options = config["options"]
                for option in options:
                    binary_col = f"{var}_{option}"
                    df[binary_col] = df[var].apply(lambda x: 1 if option in str(x).split(',') else 0)

    # Subset data to required variables
    try:
        all_vars = req.row_vars + req.col_vars
        if req.weight_var:
            all_vars.append(req.weight_var)
        if req.subgroup:
            all_vars.append(req.subgroup)
        df = df[all_vars]
        logger.info(f"Subset data shape for selected variables: {df.shape}")
    except Exception as e:
        logger.error(f"Error subsetting data: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error subsetting data: {str(e)}")
    
    # Create crosstab (fully dynamic, robust to missing values)
    try:
        # For multiple response variables, create separate crosstabs and combine them
        if req.multiple_response:
            cts = []
            for var, config in req.multiple_response.items():
                if config["type"] == "select_all":
                    options = config["options"]
                    for option in options:
                        binary_col = f"{var}_{option}"
                        if var in req.row_vars:
                            # Create a temporary DataFrame with the binary column
                            temp_df = pd.DataFrame({
                                binary_col: df[binary_col],
                                **{col: df[col] for col in req.col_vars}
                            })
                            # Create crosstab with the binary column
                            ct_part = pd.crosstab(
                                temp_df[binary_col],
                                [temp_df[col] for col in req.col_vars],
                                dropna=False
                            )
                            # Use the binary column name directly as the index
                            ct_part.index = pd.Index([binary_col], name=var)
                            cts.append(ct_part)
                        elif var in req.col_vars:
                            # Create a temporary DataFrame with the binary column
                            temp_df = pd.DataFrame({
                                **{col: df[col] for col in req.row_vars},
                                binary_col: df[binary_col]
                            })
                            # Create crosstab with the binary column
                            ct_part = pd.crosstab(
                                [temp_df[col] for col in req.row_vars],
                                temp_df[binary_col],
                                dropna=False
                            )
                            # Use the binary column name directly as the column
                            ct_part.columns = pd.Index([binary_col], name=var)
                            cts.append(ct_part)
            ct = pd.concat(cts, axis=0 if var in req.row_vars else 1)
        else:
            crosstab_kwargs = dict(
                index=[df[v] for v in req.row_vars],
                columns=[df[v] for v in req.col_vars],
                dropna=False
            )
            if req.weight_var:
                crosstab_kwargs['values'] = df[req.weight_var]
                crosstab_kwargs['aggfunc'] = 'sum'
            ct = pd.crosstab(**crosstab_kwargs)
        
        logger.info(f"Crosstab created. Shape: {ct.shape}")
        # Drop all-zero rows and columns
        before_shape = ct.shape
        ct = ct.loc[(ct != 0).any(axis=1), (ct != 0).any(axis=0)]
        after_shape = ct.shape
        dropped_zeros = before_shape != after_shape
        logger.info(f"Crosstab after dropping zero-frequency rows/cols: {ct.shape}")
        if ct.shape == (0, 0):
            raise HTTPException(status_code=400, detail="All combinations have zero frequency. No valid data to display after dropping zero-frequency rows/columns.")
        
        # Convert to the expected response format
        result = {
            'table': {
                'data': ct.to_dict(),
                'index_name': ct.index.name,
                'column_names': [name for name in ct.columns.names if name],
                'original_index': ct.index.tolist(),
                'original_columns': ct.columns.tolist()
            }
        }
        
        # Add multiple response configuration if present
        if req.multiple_response:
            result['multiple_response'] = req.multiple_response
        
        return result
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
            # Convert crosstab to numpy array for statistical tests
            ct_array = ct.values
            chi2_results = chi_square(ct_array)
            chi2_results = mark_significance(chi2_results)
            
            # Format chi-square results consistently
            stats["chi_square"] = {
                "statistic": chi2_results["chi2"],
                "p_value": chi2_results["p_value"],
                "degrees_of_freedom": chi2_results["dof"],
                "significant": chi2_results["significant"],
                "significance": chi2_results.get("significance", "ns")
            }
            
            logger.info(f"Calculated chi-square results: {stats['chi_square']}")
            
            # Calculate additional statistics
            n = ct.values.sum()
            phi = np.sqrt(chi2_results["chi2"] / n) if min(ct.shape) == 2 else None
            cramer_v = np.sqrt(chi2_results["chi2"] / (n * (min(ct.shape) - 1))) if min(ct.shape) > 1 else None
            contingency = np.sqrt(chi2_results["chi2"] / (chi2_results["chi2"] + n))
            
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
        
        def convert_crosstab_to_dict(crosstab_df: pd.DataFrame) -> Dict[str, Any]:
            """Convert crosstab DataFrame to a dictionary format."""
            # Convert index and columns to strings while preserving names
            index_name = crosstab_df.index.name
            column_names = crosstab_df.columns.names if isinstance(crosstab_df.columns, pd.MultiIndex) else [crosstab_df.columns.name]
            
            def safe_convert_to_float(val):
                """Safely convert a value to float, returning 0 if not possible."""
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return 0.0
            
            # If we have a MultiIndex, handle it appropriately
            if isinstance(crosstab_df.index, pd.MultiIndex):
                result = {}
                for idx_tuple in crosstab_df.index:
                    if len(idx_tuple) == 1:
                        key = str(idx_tuple[0])
                    else:
                        key = '_'.join(str(x) for x in idx_tuple)
                    row_dict = {}
                    for col in crosstab_df.columns:
                        col_key = '_'.join(str(x) for x in col) if isinstance(col, tuple) else str(col)
                        row_dict[col_key] = safe_convert_to_float(crosstab_df.loc[idx_tuple, col])
                    result[key] = row_dict
            else:
                # For regular index, convert to dict while preserving names
                result = {}
                for idx in crosstab_df.index:
                    row_dict = {}
                    for col in crosstab_df.columns:
                        col_key = str(col)
                        row_dict[col_key] = safe_convert_to_float(crosstab_df.loc[idx, col])
                    result[str(idx)] = row_dict
            
            return {
                "data": result,
                "index_name": index_name,
                "column_names": column_names,
                "original_index": [str(x) for x in crosstab_df.index.values],
                "original_columns": [str(x) for x in crosstab_df.columns.values]
            }
        
        table_dict = convert_crosstab_to_dict(ct.round(req.decimal_places).astype(float).replace(np.nan, 0))
        percentages_dict = {k: convert_index_keys(v.to_dict()) for k, v in pct_tables.items()}
        result = {
            "table": table_dict,
            "percentages": percentages_dict,
            "stats": stats,
            "dropped_zero_rows_cols": dropped_zeros,
            "multiple_response": req.multiple_response
        }
        logger.info("Successfully completed crosstab analysis")
        return result
    except Exception as e:
        logger.error(f"Error formatting output: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error formatting output: {str(e)}") 