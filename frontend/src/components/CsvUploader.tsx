import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface CsvData {
  filename: string;
  rows: number;
  columns: string[];
  sample_data: Record<string, any>[];
}

const CsvUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      console.log('Selected file:', selectedFile);
      
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        console.log('File selected:', selectedFile.name);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Starting upload for file:', file.name);
      const response = await axios.post('http://localhost:8000/api/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      });
      
      console.log('Upload response:', response.data);
      if (response.data) {
        setCsvData(response.data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Upload error:', err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.detail || err.message;
        console.error('Server error:', errorMessage);
        setError(`Error uploading file: ${errorMessage}`);
      } else {
        setError('Error uploading file. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          CSV File Upload
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
          >
            Select CSV File
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleFileChange}
            />
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>

        {loading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {uploadProgress}% uploaded
            </Typography>
          </Box>
        )}

        {file && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            Selected file: {file.name}
          </Typography>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {csvData && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            File Information
          </Typography>
          <Typography variant="body1" gutterBottom>
            Filename: {csvData.filename}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Number of rows: {csvData.rows}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Columns: {csvData.columns.join(', ')}
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Sample Data
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {csvData.columns.map((column) => (
                    <TableCell key={column}>{column}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {csvData.sample_data.map((row, index) => (
                  <TableRow key={index}>
                    {csvData.columns.map((column) => (
                      <TableCell key={column}>{row[column]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default CsvUploader; 