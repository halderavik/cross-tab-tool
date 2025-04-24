# SPSS Cross-Tab Tool

An AI-powered platform for analyzing SPSS files and performing advanced cross-tabulations.

## Features

- SPSS File Support: Upload and analyze SPSS (.sav) files with ease
  - Extract variable metadata (names, labels, types)
  - Handle value labels and missing values
  - Generate sample data previews
  - Comprehensive error handling
- Cross-Tabulation: Create complex cross-tabs and banner tables
- Visualizations: Generate charts and graphs from your analysis
- AI Assistant: Get help with your analysis from our AI agent

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Radix UI Components
- Next Themes

### Backend
- Python FastAPI
- PostgreSQL
- SQLAlchemy ORM
- PyReadStat for SPSS file processing
- Pytest for testing

## Getting Started

### Frontend

1. Clone the repository:
```bash
git clone https://github.com/halderavik/cross_tab_tool.git
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the tests:
```bash
python -m pytest
```

5. Start the backend server:
```bash
uvicorn main:app --reload
```

## License

MIT
