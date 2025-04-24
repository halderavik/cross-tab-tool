import pyreadstat
from typing import Dict, List, Any, Tuple
from pathlib import Path
import pandas as pd
from datetime import datetime

class SPSSProcessor:
    """Processor for handling SPSS (.sav) files."""
    
    def __init__(self, file_path: Path):
        """
        Initialize the SPSS processor.
        
        Args:
            file_path: Path to the SPSS file
        """
        self.file_path = file_path
        self.metadata = None
        self.data = None
        self.variable_metadata = None
        
    def read_file(self) -> Tuple[Dict[str, Any], pd.DataFrame]:
        """
        Read the SPSS file and extract metadata and data.
        
        Returns:
            Tuple containing metadata dictionary and pandas DataFrame
        """
        try:
            # Read the SPSS file
            df, meta = pyreadstat.read_sav(
                self.file_path,
                metadataonly=False,
                apply_value_formats=True
            )
            
            self.data = df
            self.metadata = meta
            
            # Extract variable metadata
            self.variable_metadata = self._extract_variable_metadata(meta)
            
            return self.variable_metadata, df
            
        except Exception as e:
            raise Exception(f"Error reading SPSS file: {str(e)}")
    
    def _extract_variable_metadata(self, meta: Any) -> Dict[str, Any]:
        """
        Extract metadata about variables from the SPSS file.
        
        Args:
            meta: Metadata object from pyreadstat
            
        Returns:
            Dictionary containing variable metadata
        """
        variable_metadata = {}
        
        # Get variable names and labels
        for var_name in meta.column_names:
            var_label = meta.column_labels[meta.column_names.index(var_name)]
            var_type = meta.readstat_variable_types[var_name]
            
            # Get value labels if they exist
            value_labels = {}
            if var_name in meta.variable_value_labels:
                value_labels = meta.variable_value_labels[var_name]
            
            # Get missing values if they exist
            missing_values = []
            if var_name in meta.missing_ranges:
                missing_values = meta.missing_ranges[var_name]
            
            variable_metadata[var_name] = {
                "label": var_label,
                "type": self._get_variable_type(var_type),
                "value_labels": value_labels,
                "missing_values": missing_values
            }
        
        return variable_metadata
    
    def _get_variable_type(self, spss_type: int) -> str:
        """
        Convert SPSS variable type to our internal type.
        
        Args:
            spss_type: SPSS variable type code
            
        Returns:
            String representing the variable type
        """
        # SPSS type codes:
        # 0 = numeric
        # 1 = string
        # 2 = date
        # 3 = time
        # 4 = datetime
        if spss_type == 0:
            return "numeric"
        elif spss_type == 1:
            return "string"
        elif spss_type in [2, 3, 4]:
            return "datetime"
        else:
            return "unknown"
    
    def get_sample_data(self, n_rows: int = 5) -> Dict[str, List[Any]]:
        """
        Get a sample of the data.
        
        Args:
            n_rows: Number of rows to return
            
        Returns:
            Dictionary containing sample data
        """
        if self.data is None:
            raise Exception("Data not loaded. Call read_file() first.")
        
        return self.data.head(n_rows).to_dict(orient='list')
    
    def get_variable_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for numeric variables.
        
        Returns:
            Dictionary containing variable summaries
        """
        if self.data is None:
            raise Exception("Data not loaded. Call read_file() first.")
        
        summary = {}
        for var_name, var_meta in self.variable_metadata.items():
            if var_meta["type"] == "numeric":
                var_data = self.data[var_name]
                summary[var_name] = {
                    "min": var_data.min(),
                    "max": var_data.max(),
                    "mean": var_data.mean(),
                    "std": var_data.std(),
                    "missing": var_data.isna().sum()
                }
        
        return summary 