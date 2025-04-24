import pytest
from pathlib import Path
from processors.spss_processor import SPSSProcessor
import pandas as pd

# Test file path
SAMPLE_FILE_PATH = Path("C:/Users/Avik Halder/my_dev/cross-tab-tool/sample_data.sav")

def test_spss_processor_initialization():
    """Test the initialization of SPSSProcessor."""
    processor = SPSSProcessor(SAMPLE_FILE_PATH)
    assert processor.file_path == SAMPLE_FILE_PATH
    assert processor.metadata is None
    assert processor.data is None
    assert processor.variable_metadata is None

def test_read_file():
    """Test reading the SPSS file and extracting metadata."""
    processor = SPSSProcessor(SAMPLE_FILE_PATH)
    variable_metadata, df = processor.read_file()
    
    # Check that we got data back
    assert isinstance(variable_metadata, dict)
    assert isinstance(df, pd.DataFrame)
    
    # Check that the processor's internal state was updated
    assert processor.metadata is not None
    assert processor.data is not None
    assert processor.variable_metadata is not None
    
    # Check that the DataFrame is not empty
    assert not df.empty
    
    # Check that we have variable metadata for each column
    assert len(variable_metadata) == len(df.columns)

def test_get_sample_data():
    """Test getting sample data from the SPSS file."""
    processor = SPSSProcessor(SAMPLE_FILE_PATH)
    processor.read_file()
    
    # Test default number of rows
    sample_data = processor.get_sample_data()
    assert isinstance(sample_data, dict)
    assert len(sample_data) > 0
    
    # Test custom number of rows
    custom_rows = 3
    custom_sample = processor.get_sample_data(n_rows=custom_rows)
    assert isinstance(custom_sample, dict)
    assert len(custom_sample) > 0

def test_get_variable_summary():
    """Test getting variable summaries from the SPSS file."""
    processor = SPSSProcessor(SAMPLE_FILE_PATH)
    processor.read_file()
    
    summary = processor.get_variable_summary()
    assert isinstance(summary, dict)
    
    # Check that numeric variables have the expected summary statistics
    for var_name, stats in summary.items():
        assert "min" in stats
        assert "max" in stats
        assert "mean" in stats
        assert "std" in stats
        assert "missing" in stats

def test_invalid_file_path():
    """Test handling of invalid file path."""
    with pytest.raises(Exception):
        processor = SPSSProcessor(Path("nonexistent_file.sav"))
        processor.read_file()

def test_get_sample_data_before_read():
    """Test error when trying to get sample data before reading file."""
    processor = SPSSProcessor(SAMPLE_FILE_PATH)
    with pytest.raises(Exception, match="Data not loaded"):
        processor.get_sample_data()

def test_get_variable_summary_before_read():
    """Test error when trying to get variable summary before reading file."""
    processor = SPSSProcessor(SAMPLE_FILE_PATH)
    with pytest.raises(Exception, match="Data not loaded"):
        processor.get_variable_summary() 