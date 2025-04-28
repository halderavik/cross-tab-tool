# SPSS Cross-Tab Tool

An AI-powered platform for analyzing SPSS files and performing advanced cross-tabulations.

## Features

- SPSS File Support: Upload and analyze SPSS (.sav) and CSV files
  - Extract variable metadata (names, labels, types)
  - Handle value labels and missing values
  - Generate sample data previews
  - Comprehensive error handling
- Cross-Tabulation: Create complex cross-tabs and banner tables
- Visualizations: Generate charts and graphs from your analysis, with support for bar, line, and pie charts in the AI agent chat popup
- AI Assistant: Get help with your analysis from our AI agent, including visualization popups and dynamic statistics
- State Management: React Context for application-wide state
- Type Safety: Full TypeScript implementation
- **Custom Variable Builder**: Create new variables by combining values from any columns, with dropdowns showing all possible values for each condition. **Custom variables are now managed and created only from the Variables section/tab of the workspace.**

## Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- Radix UI Components
- Next Themes
- React Context API
- Recharts (for chart visualizations)

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
- Implement proper type definitions
- Use React Context for state management

### Testing
- Backend: pytest
- Frontend: Jest
- Type checking with TypeScript

## License

MIT

## Data Viewer Improvements
- The Data Viewer now includes a 'Load Full Data' button in the Data tab. Clicking this button fetches and displays the entire dataset (all rows) for both CSV and SPSS files, using the new backend endpoints.

## API Endpoints
- `GET /api/csv-full/{filename}`: Returns all rows and columns for a given CSV file.
- `GET /api/spss-full/{filename}`: Returns all rows and columns for a given SPSS (.sav) file.
