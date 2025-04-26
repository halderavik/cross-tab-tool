from database import engine, Base
from models import UploadedFile, AnalysisSession, VariableDefinition
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

def init_database():
    load_dotenv()
    
    # Database connection parameters
    params = {
        'dbname': 'postgres',
        'user': os.getenv('POSTGRES_USER'),
        'password': os.getenv('POSTGRES_PASSWORD'),
        'host': os.getenv('POSTGRES_HOST'),
        'port': os.getenv('POSTGRES_PORT')
    }
    
    # Create database if it doesn't exist
    try:
        conn = psycopg2.connect(**params)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (os.getenv('POSTGRES_DB'),))
        if cur.fetchone() is None:
            # Database doesn't exist, create it
            cur.execute(sql.SQL("CREATE DATABASE {}").format(
                sql.Identifier(os.getenv('POSTGRES_DB'))
            ))
            print(f"Created database {os.getenv('POSTGRES_DB')}")
        else:
            print(f"Database {os.getenv('POSTGRES_DB')} already exists")
            
        cur.close()
        conn.close()
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("Created all tables")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    init_database() 