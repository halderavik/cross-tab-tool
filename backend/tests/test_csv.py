import pytest
from fastapi.testclient import TestClient
from main import app
import os
import pandas as pd
from io import StringIO

client = TestClient(app)

def test_upload_csv():
    # Create a sample CSV file
    csv_data = """name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago"""
    
    # Create a test file
    test_file = StringIO(csv_data)
    test_file.name = "test.csv"
    
    # Test the upload endpoint
    response = client.post(
        "/api/upload-csv",
        files={"file": ("test.csv", test_file, "text/csv")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.csv"
    assert data["rows"] == 3
    assert data["columns"] == ["name", "age", "city"]
    assert len(data["sample_data"]) == 3

def test_upload_invalid_file():
    # Test with a non-CSV file
    response = client.post(
        "/api/upload-csv",
        files={"file": ("test.txt", b"not a csv", "text/plain")}
    )
    
    assert response.status_code == 400
    assert "File must be a CSV" in response.json()["detail"]

def test_get_csv_info():
    # First upload a file
    csv_data = """name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago"""
    
    test_file = StringIO(csv_data)
    test_file.name = "test_info.csv"
    
    upload_response = client.post(
        "/api/upload-csv",
        files={"file": ("test_info.csv", test_file, "text/csv")}
    )
    assert upload_response.status_code == 200
    
    # Then test getting its info
    response = client.get("/api/csv-info/test_info.csv")
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test_info.csv"
    assert data["rows"] == 3
    assert data["columns"] == ["name", "age", "city"]

def test_get_nonexistent_csv():
    response = client.get("/api/csv-info/nonexistent.csv")
    assert response.status_code == 404
    assert "File not found" in response.json()["detail"] 