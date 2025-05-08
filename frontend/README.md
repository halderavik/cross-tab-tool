# SPSS Cross-Tab Tool Frontend

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
- Accessibility: Fully accessible UI components with proper ARIA labels and descriptions
- Real-time Analysis: Interactive data analysis with immediate feedback
- Error Handling: Comprehensive error handling for all operations
- Responsive Design: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- Next.js 13+
- TypeScript
- Tailwind CSS
- Radix UI Components
  - @radix-ui/react-accordion
  - @radix-ui/react-checkbox
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-label
  - @radix-ui/react-popover
  - @radix-ui/react-progress
  - @radix-ui/react-scroll-area
  - @radix-ui/react-select
  - @radix-ui/react-slot
  - @radix-ui/react-tabs
  - @radix-ui/react-toast
  - @radix-ui/react-tooltip
- Next Themes
- React Context API
- Recharts (for chart visualizations)
- Lucide React (Icons)
- Class Variance Authority
- clsx
- Tailwind Merge
- Material UI (@mui/material, @mui/icons-material)
- Emotion (@emotion/react, @emotion/styled)
- Floating UI (@floating-ui/react-dom)
- Axios

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting Started

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
- Use TypeScript for all components
- Follow React best practices
- Maintain consistent naming conventions
- Implement proper type definitions
- Use React Context for state management
- Follow accessibility guidelines (WCAG 2.1)

### Testing
- Jest for unit testing
- React Testing Library for component testing
- Type checking with TypeScript

### Component Structure
- Components are organized by feature
- Each component has its own directory with:
  - Component file
  - Test file
  - Types file (if needed)
  - Styles file (if needed)

### State Management
- React Context for global state
- Local state for component-specific data
- Custom hooks for reusable logic

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Network error handling
- Form validation
- Data processing error handling

### Accessibility
- ARIA labels and descriptions
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus management

## API Integration

The frontend communicates with the backend through the following endpoints:

- `POST /api/upload`: File upload endpoint
- `GET /api/test-connection`: Connection test endpoint
- `GET /api/csv-full/{filename}`: Full CSV data retrieval
- `GET /api/spss-full/{filename}`: Full SPSS data retrieval
- `POST /api/ai/analyze`: AI analysis endpoint

## License

MIT

## Data Viewer Improvements
- The Data Viewer now includes a 'Load Full Data' button in the Data tab. Clicking this button fetches and displays the entire dataset (all rows) for both CSV and SPSS files, using the new backend endpoints.

## API Endpoints
- `GET /api/csv-full/{filename}`: Returns all rows and columns for a given CSV file.
- `GET /api/spss-full/{filename}`: Returns all rows and columns for a given SPSS (.sav) file.
