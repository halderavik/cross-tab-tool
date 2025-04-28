from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
import logging
from datetime import datetime
from database import get_db
from models import UploadedFile, VariableDefinition, AnalysisSession
from processors.spss_processor import SPSSProcessor
import shutil
from pathlib import Path
from typing import Optional
import pyreadstat
import pandas as pd
import numpy as np
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",  # Prefix is handled in main.py
    tags=["upload"]
)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
logger.info(f"Upload directory set to: {UPLOAD_DIR}")

# Maximum file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean DataFrame by replacing special float values with None.
    
    Args:
        df: Input DataFrame
        
    Returns:
        Cleaned DataFrame
    """
    # Replace NaN, infinity, and -infinity with None
    df = df.replace([np.inf, -np.inf], np.nan)
    return df

def convert_nan_to_null(obj):
    """
    Convert NaN values to null in a nested structure.
    
    Args:
        obj: Any Python object
        
    Returns:
        Object with NaN values converted to null
    """
    if isinstance(obj, dict):
        return {k: convert_nan_to_null(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_nan_to_null(v) for v in obj]
    elif pd.isna(obj):
        return None
    return obj

@router.post("/upload", response_model=dict)
async def upload_file(
    file: UploadFile = File(...),
    fileType: str = Form(...),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Upload a file to the server.
    
    Args:
        file: The file to upload
        fileType: Type of file (sav or csv)
        db: Database session
        
    Returns:
        JSONResponse with upload status and file info
    """
    logger.info(f"Received upload request for file: {file.filename}")
    logger.info(f"File type: {fileType}")
    logger.info(f"Content type: {file.content_type}")
    
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
            
        if fileType not in ['sav', 'csv']:
            raise HTTPException(status_code=400, detail="Invalid file type. Only .sav and .csv files are allowed")
            
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        logger.info(f"Saving file to: {file_path}")
        
        # Save file in chunks to handle large files
        total_size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(8192):  # 8KB chunks
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    os.remove(file_path)
                    raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
                buffer.write(chunk)
                logger.debug(f"Written {total_size} bytes so far")
                
        logger.info(f"File saved successfully. Total size: {total_size} bytes")
        
        # Process file based on type
        try:
            if fileType == 'sav':
                df, meta = pyreadstat.read_sav(file_path)
                logger.info(f"Successfully read SPSS file")
                # Clean the DataFrame to handle special float values
                df = clean_dataframe(df)
            else:  # csv
                df = pd.read_csv(file_path)
                logger.info(f"Successfully read CSV file")
            logger.info(f"DataFrame columns: {df.columns.tolist()}")
            logger.info(f"First row: {df.head(1).to_dict(orient='records')}")
            
            variables = list(df.columns)
            logger.info(f"Found {len(variables)} variables")
            
            # Get sample data (first 5 rows) and convert NaN to null
            sample_data = df.head().to_dict(orient='records')
            sample_data = convert_nan_to_null(sample_data)
            
            # Save the processed DataFrame as a parquet file
            indexed_path = file_path + ".parquet"
            df.to_parquet(indexed_path)
            logger.info(f"Saved indexed DataFrame to: {indexed_path}")
            
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            os.remove(file_path)  # Clean up invalid file
            raise HTTPException(status_code=400, detail=f"Invalid file format: {str(e)}")
                
        # Create database record
        try:
            db_file = UploadedFile(
                filename=file.filename,
                filepath=file_path,
                filesize=total_size,
                file_type=fileType.upper(),
                file_info={
                    "variables": variables,
                    "sample_data": sample_data
                },
                indexed_path=indexed_path
            )
            db.add(db_file)
            db.commit()
            db.refresh(db_file)
            
            logger.info(f"File record created in database with ID: {db_file.id}")
            
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "message": "File uploaded successfully",
                    "file_id": db_file.id,
                    "filename": db_file.filename,
                    "filepath": db_file.filepath,
                    "variables": variables,
                    "sample_data": sample_data
                }
            )
            
        except Exception as e:
            logger.error(f"Error creating database record: {str(e)}")
            os.remove(file_path)  # Clean up file if database operation fails
            raise HTTPException(status_code=500, detail="Error saving file information")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error during file upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def upload_file_old(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a file and store its metadata in the database.
    
    Args:
        file: The file to upload
        db: Database session
    
    Returns:
        Uploaded file metadata and variable information
    """
    try:
        logger.info(f"Received file upload request for {file.filename}")
        
        # Validate file type
        if not file.filename.endswith('.sav'):
            logger.error(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Only .sav files are supported")
        
        # Validate file size
        file_size = 0
        chunk_size = 1024 * 1024  # 1MB chunks
        while chunk := await file.read(chunk_size):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
        
        # Reset file pointer
        await file.seek(0)
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        logger.info(f"Saving file to {file_path}")
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                while chunk := await file.read(chunk_size):
                    buffer.write(chunk)
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
        
        logger.info(f"File saved successfully. Size: {file_size} bytes")
        
        # Process the SPSS file
        try:
            processor = SPSSProcessor(file_path)
            variable_metadata, _ = processor.read_file()
            logger.info(f"Successfully processed SPSS file. Found {len(variable_metadata)} variables")
        except Exception as e:
            logger.error(f"Error processing SPSS file: {str(e)}")
            # Clean up the uploaded file
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Error processing SPSS file: {str(e)}")
        
        # Create database record for the file
        try:
            db_file = UploadedFile(
                filename=unique_filename,
                original_filename=file.filename,
                file_size=file_size,
                file_type="SPSS",
                status="processed",
                file_metadata={
                    "variable_count": len(variable_metadata),
                    "sample_data": processor.get_sample_data(),
                    "variable_summary": processor.get_variable_summary()
                }
            )
            
            db.add(db_file)
            db.commit()
            db.refresh(db_file)
            logger.info(f"Created database record for file with ID: {db_file.id}")
            
            # Create an initial analysis session
            analysis_session = AnalysisSession(
                file_id=db_file.id,
                session_name="Initial Analysis",
                status="completed"
            )
            db.add(analysis_session)
            db.commit()
            
            return {
                "id": db_file.id,
                "filename": db_file.original_filename,
                "status": db_file.status,
                "variables": variable_metadata,
                "metadata": db_file.file_metadata
            }
            
        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred") 