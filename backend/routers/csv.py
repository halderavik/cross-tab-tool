from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import os
from typing import List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file and return its basic information.
    
    Args:
        file (UploadFile): The CSV file to upload
        
    Returns:
        dict: Basic information about the uploaded CSV
    """
    try:
        logger.info(f"Received file upload request for: {file.filename}")
        
        # Validate file extension
        if not file.filename.endswith('.csv'):
            logger.error(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="File must be a CSV")
            
        # Save the file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        logger.info(f"Saving file to: {file_path}")
        
        # Read file content
        content = await file.read()
        logger.info(f"File size: {len(content)} bytes")
        
        # Write file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        logger.info("File saved successfully")
            
        # Read CSV with pandas
        logger.info("Reading CSV with pandas")
        df = pd.read_csv(file_path)
        logger.info(f"CSV read successfully. Shape: {df.shape}")
        
        # Return basic information
        response = {
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "sample_data": df.head().to_dict(orient="records")
        }
        logger.info(f"Returning response: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/csv-info/{filename}")
async def get_csv_info(filename: str):
    """
    Get information about a previously uploaded CSV file.
    
    Args:
        filename (str): Name of the CSV file
        
    Returns:
        dict: Information about the CSV file
    """
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
            
        df = pd.read_csv(file_path)
        return {
            "filename": filename,
            "rows": len(df),
            "columns": list(df.columns),
            "sample_data": df.head().to_dict(orient="records")
        }
        
    except Exception as e:
        logger.error(f"Error reading CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 