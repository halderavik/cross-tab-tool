import pytest
import pandas as pd
import numpy as np
from routers.analyze import CrosstabRequest

def test_multiple_response_crosstab(client):
    # Create test data with a multiple-response variable
    data = {
        'social_media': [
            'Facebook,Twitter',
            'Facebook,Instagram',
            'Twitter',
            'Facebook,Twitter,Instagram',
            'Instagram'
        ],
        'age_group': ['18-24', '25-34', '35-44', '18-24', '25-34']
    }
    df = pd.DataFrame(data)
    
    # Save test data
    test_file = 'test_data.csv'
    df.to_csv(test_file, index=False)
    
    # Create request with multiple-response handling
    request = CrosstabRequest(
        file_path=test_file,
        row_vars=['social_media'],
        col_vars=['age_group'],
        multiple_response={
            'social_media': {
                'type': 'select_all',
                'options': ['Facebook', 'Twitter', 'Instagram']
            }
        }
    )
    
    # Make request
    response = client.post('/api/analyze-crosstab', json=request.dict())
    
    # Verify response
    assert response.status_code == 200
    result = response.json()
    
    # Check that the crosstab contains the expected binary columns
    assert 'social_media_Facebook' in result['table']['original_index']
    assert 'social_media_Twitter' in result['table']['original_index']
    assert 'social_media_Instagram' in result['table']['original_index']
    
    # Check that the index and column names are preserved
    assert result['table']['index_name'] is not None
    assert result['table']['column_names'] is not None
    
    # Check that the multiple-response configuration is included
    assert 'multiple_response' in result
    assert result['multiple_response']['social_media']['type'] == 'select_all'
    assert set(result['multiple_response']['social_media']['options']) == {'Facebook', 'Twitter', 'Instagram'}
    
    # Clean up
    import os
    os.remove(test_file)

def test_multiple_response_with_agent(client):
    # Create test data
    data = {
        'brands': [
            'Apple,Samsung',
            'Apple,Google',
            'Samsung',
            'Apple,Samsung,Google',
            'Google'
        ],
        'income': ['Low', 'Medium', 'High', 'Low', 'Medium']
    }
    df = pd.DataFrame(data)
    
    # Save test data
    test_file = 'test_data.csv'
    df.to_csv(test_file, index=False)
    
    # Create agent query
    query = {
        'file_id': 1,  # This would be set by the upload endpoint
        'query': "Show me the distribution of selected brands by income level",
        'context': {
            'multiple_response_vars': {
                'brands': ['Apple', 'Samsung', 'Google']
            },
            'file_path': test_file
        }
    }
    
    # Make request
    response = client.post('/api/ai/analyze', json=query)
    
    # Verify response
    assert response.status_code == 200
    result = response.json()
    
    # Check that the agent recognized the multiple-response variable
    assert 'multiple_response' in result['results']
    assert 'brands' in result['results']['multiple_response']
    
    # Check that the crosstab data is properly structured
    assert 'data' in result['results']['table']
    assert 'index_name' in result['results']['table']
    assert 'column_names' in result['results']['table']
    assert 'original_index' in result['results']['table']
    assert 'original_columns' in result['results']['table']
    
    # Check that the binary columns are present
    assert 'brands_Apple' in result['results']['table']['original_index']
    assert 'brands_Samsung' in result['results']['table']['original_index']
    assert 'brands_Google' in result['results']['table']['original_index']
    
    # Clean up
    import os
    os.remove(test_file) 