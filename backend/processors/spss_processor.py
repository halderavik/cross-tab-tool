import pyreadstat
from typing import Dict, List, Any, Tuple
from pathlib import Path
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SPSSProcessor:
    """Processor for handling SPSS (.sav) files."""
    
    def __init__(self, file_path: Path):
        """
        Initialize the SPSS processor.
        
        Args:
            file_path: Path to the SPSS file
        """
        if not isinstance(file_path, Path):
            file_path = Path(file_path)
            
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        if not file_path.is_file():
            raise ValueError(f"Path is not a file: {file_path}")
            
        self.file_path = file_path
        self.metadata = None
        self.data = None
        self.variable_metadata = None
        
    def read_file(self) -> Tuple[Dict[str, Any], pd.DataFrame]:
        """
        Read the SPSS file and extract metadata and data.
        
        Returns:
            Tuple containing metadata dictionary and pandas DataFrame
            
        Raises:
            Exception: If there's an error reading the file
        """
        try:
            logger.info(f"Reading SPSS file: {self.file_path}")
            
            # Read the SPSS file
            df, meta = pyreadstat.read_sav(
                self.file_path,
                metadataonly=False,
                apply_value_formats=True
            )
            
            if df is None or meta is None:
                raise ValueError("Failed to read SPSS file: No data or metadata returned")
                
            logger.info(f"Successfully read SPSS file. Shape: {df.shape}")
            
            self.data = df
            self.metadata = meta
            
            # Extract variable metadata
            self.variable_metadata = self._extract_variable_metadata(meta)
            
            return self.variable_metadata, df
            
        except pyreadstat.ReadstatError as e:
            logger.error(f"Pyreadstat error: {str(e)}")
            raise Exception(f"Error reading SPSS file: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error reading SPSS file: {str(e)}")
            raise Exception(f"Error reading SPSS file: {str(e)}")
    
    def _extract_variable_metadata(self, meta: Any) -> Dict[str, Any]:
        """
        Extract metadata about variables from the SPSS file.
        
        Args:
            meta: Metadata object from pyreadstat
            
        Returns:
            Dictionary containing variable metadata
        """
        try:
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
        except Exception as e:
            logger.error(f"Error extracting variable metadata: {str(e)}")
            raise Exception(f"Error extracting variable metadata: {str(e)}")
    
    def _get_variable_type(self, spss_type: int) -> str:
        """
        Convert SPSS variable type to our internal type.
        
        Args:
            spss_type: SPSS variable type code
            
        Returns:
            String representing the variable type
        """
        try:
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
                logger.warning(f"Unknown SPSS type code: {spss_type}")
                return "unknown"
        except Exception as e:
            logger.error(f"Error determining variable type: {str(e)}")
            return "unknown"
    
    def get_sample_data(self, n_rows: int = 5) -> Dict[str, List[Any]]:
        """
        Get a sample of the data.
        
        Args:
            n_rows: Number of rows to sample
            
        Returns:
            Dictionary containing sample data
        """
        try:
            if self.data is None:
                raise ValueError("No data loaded")
                
            sample = self.data.head(n_rows)
            return sample.to_dict(orient='list')
        except Exception as e:
            logger.error(f"Error getting sample data: {str(e)}")
            return {}
    
    def get_variable_summary(self) -> Dict[str, Any]:
        """
        Get summary statistics for numeric variables.
        
        Returns:
            Dictionary containing variable summaries
        """
        try:
            if self.data is None:
                raise ValueError("No data loaded")
                
            summary = {}
            for var_name, var_meta in self.variable_metadata.items():
                if var_meta["type"] == "numeric":
                    var_data = self.data[var_name]
                    summary[var_name] = {
                        "count": var_data.count(),
                        "mean": var_data.mean(),
                        "std": var_data.std(),
                        "min": var_data.min(),
                        "max": var_data.max()
                    }
            return summary
        except Exception as e:
            logger.error(f"Error getting variable summary: {str(e)}")
            return {}
    
    def get_crosstab(self, index: str, columns: str, normalize: bool = False, margins: bool = False) -> Dict[str, Any]:
        """
        Generate a crosstab (contingency table) for two variables.

        Args:
            index (str): The variable to use as the row index.
            columns (str): The variable to use as the column index.
            normalize (bool): Whether to normalize the crosstab (show proportions instead of counts).
            margins (bool): Whether to include row/column totals.

        Returns:
            Dict[str, Any]: Crosstab as a nested dictionary.
        """
        try:
            if self.data is None:
                raise ValueError("No data loaded")
            if index not in self.data.columns or columns not in self.data.columns:
                raise ValueError(f"Variables '{index}' or '{columns}' not found in data")
            ctab = pd.crosstab(
                self.data[index],
                self.data[columns],
                normalize='all' if normalize else False,
                margins=margins
            )
            return ctab.to_dict()
        except Exception as e:
            logger.error(f"Error generating crosstab: {str(e)}")
            return {} 