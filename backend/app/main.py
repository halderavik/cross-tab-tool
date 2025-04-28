from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import crosstab, data_upload, custom_variables

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(crosstab.router, prefix="/api", tags=["crosstab"])
app.include_router(data_upload.router, prefix="/api", tags=["data-upload"])
app.include_router(custom_variables.router, prefix="/api", tags=["custom-variables"])

@app.get("/")
async def root():
    return {"message": "Cross-tabulation API is running"} 