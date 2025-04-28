import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UploadedFile {
  id: number;
  filename: string;
  file_path: string;
  uploaded_at: string;
}

interface DataContextType {
  selectedFile: UploadedFile | null;
  setSelectedFile: (file: UploadedFile | null) => void;
}

const DataContext = createContext<DataContextType>({
  selectedFile: null,
  setSelectedFile: () => {},
});

export const useDataContext = () => useContext(DataContext);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  return (
    <DataContext.Provider value={{ selectedFile, setSelectedFile }}>
      {children}
    </DataContext.Provider>
  );
}; 