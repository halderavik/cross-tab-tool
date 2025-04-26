import requests
import os
from pathlib import Path
import pandas as pd
import numpy as np
import pyreadstat

def create_test_spss_file():
    # Create test data
    data = {
        'ID': range(1, 6),
        'Gender': ['Male', 'Female', 'Male', 'Female', 'Male'],
        'Age': [25, 30, 35, 40, 45],
        'Score': [85, 90, 75, 80, 95]
    }
    df = pd.DataFrame(data)
    
    # Save as SPSS file
    test_file_path = Path("uploads/test_file.sav")
    test_file_path.parent.mkdir(exist_ok=True)
    pyreadstat.write_sav(df, test_file_path)
    return test_file_path

def test_file_upload():
    try:
        # Create test SPSS file
        file_path = create_test_spss_file()
        print(f"Created test SPSS file at: {file_path}")
        
        # Upload the file using requests
        url = "http://localhost:8000/api/upload"  # Using the upload endpoint
        with open(file_path, "rb") as f:
            files = {
                "file": (file_path.name, f, "application/octet-stream")
            }
            headers = {
                "accept": "application/json"
            }
            print(f"Uploading file to {url}")
            response = requests.post(url, files=files, headers=headers)
            
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 200:
            print(f"Headers: {response.headers}")
            print(f"Request URL: {response.request.url}")
            print(f"Request Headers: {response.request.headers}")
        
    except requests.exceptions.RequestException as e:
        print(f"Request error: {str(e)}")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        # Clean up test file
        if os.path.exists(file_path):
            os.remove(file_path)
            print("Cleaned up test file")

if __name__ == "__main__":
    test_file_upload() 