import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app

@pytest.fixture
def client():
    """Create a test client for FastAPI app."""
    with TestClient(app) as client:
        yield client 