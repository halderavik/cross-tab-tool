from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class UploadedFile(Base):
    """Model for storing uploaded file metadata."""
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    filesize = Column(Integer, nullable=False)
    file_type = Column(String(10), nullable=False)  # 'SPSS' or 'CSV'
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="pending")
    file_info = Column(JSON, nullable=True)

    # Relationships
    variables = relationship("VariableDefinition", back_populates="file")
    analysis_sessions = relationship("AnalysisSession", back_populates="file")

class AnalysisSession(Base):
    """Model for storing analysis sessions."""
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    status = Column(String(20), default="active")
    settings = Column(JSON, nullable=True)
    results = Column(JSON, nullable=True)

    # Relationships
    file = relationship("UploadedFile", back_populates="analysis_sessions")

class VariableDefinition(Base):
    """Model for storing variable definitions and metadata."""
    __tablename__ = "variable_definitions"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id"))
    name = Column(String(255), nullable=False)
    label = Column(String(512), nullable=True)
    type = Column(String(50), nullable=False)
    values = Column(JSON, nullable=True)
    missing_values = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    file = relationship("UploadedFile", back_populates="variables") 