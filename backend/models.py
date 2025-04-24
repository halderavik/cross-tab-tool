from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class UploadedFile(Base):
    """Model for storing uploaded file metadata."""
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    file_type = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, processed, error
    file_metadata = Column(JSON)  # Store file-specific metadata
    analysis_sessions = relationship("AnalysisSession", back_populates="uploaded_file")

class AnalysisSession(Base):
    """Model for storing analysis sessions."""
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    session_name = Column(String)
    status = Column(String, default="active")  # active, completed, error
    uploaded_file = relationship("UploadedFile", back_populates="analysis_sessions")
    variable_definitions = relationship("VariableDefinition", back_populates="analysis_session")

class VariableDefinition(Base):
    """Model for storing variable definitions and metadata."""
    __tablename__ = "variable_definitions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"))
    variable_name = Column(String, nullable=False)
    variable_type = Column(String, nullable=False)  # nominal, ordinal, scale
    variable_label = Column(String)
    value_labels = Column(JSON)  # Store value labels as JSON
    missing_values = Column(JSON)  # Store missing value definitions
    analysis_session = relationship("AnalysisSession", back_populates="variable_definitions") 