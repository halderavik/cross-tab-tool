from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import os
from datetime import datetime
from database import get_db
from models import UploadedFile, VariableDefinition, AnalysisSession
from processors.spss_processor import SPSSProcessor
import shutil
from pathlib import Path

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Create upload directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/")
async def upload_file(
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
        # Validate file type
        if not file.filename.endswith('.sav'):
            raise HTTPException(status_code=400, detail="Only .sav files are supported")
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Process the SPSS file
        processor = SPSSProcessor(file_path)
        variable_metadata, _ = processor.read_file()
        
        # Create database record for the file
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
        
        # Create an initial analysis session
        analysis_session = AnalysisSession(
            file_id=db_file.id,
            session_name="Initial Analysis",
            status="active"
        )
        
        db.add(analysis_session)
        db.commit()
        db.refresh(analysis_session)
        
        # Create variable definitions
        for var_name, var_meta in variable_metadata.items():
            var_def = VariableDefinition(
                session_id=analysis_session.id,
                variable_name=var_name,
                variable_type=var_meta["type"],
                variable_label=var_meta["label"],
                value_labels=var_meta["value_labels"],
                missing_values=var_meta["missing_values"]
            )
            db.add(var_def)
        
        db.commit()
        
        return {
            "id": db_file.id,
            "filename": db_file.filename,
            "original_filename": db_file.original_filename,
            "file_size": db_file.file_size,
            "status": db_file.status,
            "upload_date": db_file.upload_date,
            "metadata": db_file.file_metadata,
            "variables": variable_metadata
        }
        
    except Exception as e:
        # Clean up file if it was saved
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=str(e)) 