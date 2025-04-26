from database import engine, SessionLocal
from sqlalchemy import text

def test_connection():
    try:
        # Try to connect using the engine
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Database connection successful!")
            return True
    except Exception as e:
        print(f"Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_connection() 