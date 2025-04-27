from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging
from routers import upload, csv
from datetime import datetime
from routers.analyze import router as analyze_router
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Cross-Tab Tool API",
    description="API for Cross-Tab Tool",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Test connection endpoint
@app.get("/api/test-connection")
async def test_connection():
    """Test endpoint to verify API connection"""
    logger.info("Test connection endpoint called")
    return {
        "status": "success",
        "message": "API connection is working",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include routers
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(csv.router, prefix="/api", tags=["csv"])
app.include_router(analyze_router)

@app.get("/")
async def root():
    """Root endpoint that returns a simple message."""
    return {"message": "Welcome to the Cross-Tab Tool API"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

print(f"[FastAPI Startup] Python executable: {sys.executable}")
print(f"[FastAPI Startup] Python path: {sys.path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    ) 