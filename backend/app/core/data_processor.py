import pandas as pd
import logging

logger = logging.getLogger(__name__)

class DataProcessor:
    """Base class for data processing operations."""
    
    def __init__(self):
        self.data = None
    
    def load_data(self, file_path: str) -> pd.DataFrame:
        """Load data from file."""
        try:
            if file_path.endswith('.sav'):
                import pyreadstat
                df, _ = pyreadstat.read_sav(file_path)
            else:
                df = pd.read_csv(file_path)
            self.data = df
            return df
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise 