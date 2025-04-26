# SPSS Cross-Tab Tool

An AI-powered platform for analyzing SPSS files and performing advanced cross-tabulations.

## Features

- SPSS File Support: Upload and analyze SPSS (.sav) and CSV files
  - Extract variable metadata (names, labels, types)
  - Handle value labels and missing values
  - Generate sample data previews
  - Comprehensive error handling
- Cross-Tabulation: Create complex cross-tabs and banner tables
- Visualizations: Generate charts and graphs from your analysis
- AI Assistant: Get help with your analysis from our AI agent

## Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- Radix UI Components
- Next Themes

### Backend
- Python FastAPI
- PostgreSQL
- SQLAlchemy ORM
- PyReadStat for SPSS file processing
- pandas
- Pytest for testing

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- npm or yarn

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/Mac:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Create a `.env` file in the backend directory with:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/cross_tab_db
   ```
5. Initialize the database:
   ```bash
   python init_db.py
   ```
6. Start the backend server:
   ```bash
   # Recommended (hot reload):
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   # Or (production):
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Code Style
- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Maintain consistent naming conventions

### Testing
- Backend: pytest
- Frontend: Jest

## License

MIT
