import React from 'react';
import { AIAgentChat } from '@/components/AIAgent/AIAgentChat';
import { DataProvider } from '@/contexts/DataContext';

export default function AIAgentPage() {
  return (
    <DataProvider>
      <div className="w-full px-0 py-4 max-w-none">
        <h1 className="text-2xl font-bold mb-4">AI Data Analysis Assistant</h1>
        <p className="mb-4 text-gray-600">
          Ask questions about your data and get instant analysis with visualizations.
          The AI assistant will help you understand relationships and patterns in your data.
        </p>
        <AIAgentChat />
      </div>
    </DataProvider>
  );
} 