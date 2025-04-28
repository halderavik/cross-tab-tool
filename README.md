# Cross-Tab Tool

A modern web application for analyzing and processing survey data from SPSS (.sav) and CSV files.

## Features

- **File Upload**: Support for both SPSS (.sav) and CSV file formats
- **Data Processing**: Automatic handling of special values (NaN, infinity)
- **Variable Analysis**: View and analyze survey variables
- **Cross-Tabulation**: Create and analyze cross-tabulations
- **Modern UI**: Built with Next.js and TypeScript
- **RESTful API**: FastAPI backend with proper error handling
- **Data Context**: React context for managing application state
- **Type Safety**: Full TypeScript support with proper type definitions
- **AI Assistant**: Get help with your analysis from our AI agent, including visualizations and dynamic statistics
- **Visualizations**: Generate charts and graphs from your analysis, with support for bar, line, and pie charts in the AI agent chat popup
- **Custom Variable Builder**: Create new variables by combining values from any columns, with dropdowns showing all possible values for each condition. **Custom variables are now managed and created only from the Variables section/tab of the workspace.**

## Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- React Query
- Axios
- React Context API

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- pyreadstat (for SPSS file processing)
- pandas

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- npm or yarn

## Installation

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/cross_tab_db
   ```

4. Initialize the database:
   ```bash
   python init_db.py
   ```

5. Start the backend server:
   ```bash
   # Recommended (hot reload):
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   # Or (production):
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### File Upload
- `POST /api/upload`
  - Accepts: SPSS (.sav) or CSV files
  - Returns: File metadata and sample data

### Test Connection
- `GET /api/test-connection`
  - Returns: API status and timestamp

### Data Retrieval
- `GET /api/csv-full/{filename}`: Returns all rows and columns for a given CSV file.
- `GET /api/spss-full/{filename}`: Returns all rows and columns for a given SPSS (.sav) file.

### Data Viewer Improvements
- The Data Viewer now includes a 'Load Full Data' button in the Data tab. Clicking this button fetches and displays the entire dataset (all rows) for both CSV and SPSS files, using the new backend endpoints.

## Development

### Code Style
- Follow PEP 8 for Python code
- Use TypeScript for frontend development
- Maintain consistent naming conventions
- Use React Context for state management
- Implement proper type definitions for all components

### Testing
- Backend: pytest
- Frontend: Jest
- Type checking with TypeScript

## Error Handling

The application includes comprehensive error handling for:
- File upload errors
- Database operations
- API connectivity
- CORS issues
- Special value processing (NaN, infinity)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 

### Additional Frontend Dependencies
- [recharts](https://recharts.org/) (for chart visualizations) 