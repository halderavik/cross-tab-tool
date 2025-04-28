import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useData } from '@/contexts/data-context';
import { CrossTabResult, AgentResponse } from '@/types/analysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  analysis?: AgentResponse;
  status?: 'loading' | 'error' | 'success';
  progress?: string;
}

// Visually hidden component for accessibility
const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', border: 0 }}>{children}</span>
);

const chartTypes = [
  { label: 'Bar Chart', value: 'bar' },
  { label: 'Line Chart', value: 'line' },
  { label: 'Pie Chart', value: 'pie' },
];

export const AIAgentChat: React.FC = () => {
  const { dataFile } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState<AgentResponse | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !dataFile || !dataFile.id) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const loadingMessage: Message = {
      id: Date.now() + 1,
      text: "I'm analyzing your data. This may take a few moments...",
      sender: 'agent',
      timestamp: new Date(),
      status: 'loading',
      progress: 'Initializing analysis...'
    };
    setMessages((prev) => [...prev, loadingMessage]);

    // Timeout logic
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      setMessages((prev) => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              text: 'Sorry, the analysis is taking too long. Please try again or check your data.',
              status: 'error',
              progress: undefined
            }
          : msg
      ));
      setIsLoading(false);
    }, 30000); // 30 seconds

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input,
          file_id: dataFile.id,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMsg = 'Failed to analyze data';
        try {
          const errData = await response.json();
          if (errData.detail) {
            if (typeof errData.detail === 'string') {
              errorMsg = errData.detail;
            } else if (Array.isArray(errData.detail) || typeof errData.detail === 'object') {
              errorMsg = JSON.stringify(errData.detail);
            }
          }
        } catch {}
        setMessages((prev) => prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text: errorMsg,
                status: 'error',
                progress: undefined
              }
            : msg
        ));
        return;
      }

      const data = await response.json();
      setMessages((prev) => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              text: data.explanation,
              analysis: data,
              status: 'success',
              progress: undefined
            }
          : msg
      ));
    } catch (error: any) {
      clearTimeout(timeout);
      let errorMsg = 'Sorry, I encountered an error while analyzing your data. Please try again.';
      if (error.name === 'AbortError') {
        errorMsg = 'Sorry, the analysis timed out. Please try again or check your data.';
      }
      setMessages((prev) => prev.map(msg =>
        msg.id === loadingMessage.id
          ? {
              ...msg,
              text: errorMsg,
              status: 'error',
              progress: undefined
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const renderVisualization = (analysis: AgentResponse) => {
    if (analysis.analysis_type === 'crosstab' && analysis.results?.crosstab) {
      const firstRow = Object.keys(analysis.results.crosstab)[0];
      if (!firstRow) return null;
      
      const columns = Object.keys(analysis.results.crosstab[firstRow]);
      
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cross-Tabulation Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {analysis.variables[0]}
                  </th>
                  {columns.map((col) => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analysis.results.crosstab).map(([row, cols]) => (
                  <tr key={row}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row}
                    </td>
                    {Object.values(cols).map((value, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analysis.results.chi_square && (
            <div className="mt-4">
              <h4 className="text-md font-semibold">Chi-Square Test Results</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-600">Statistic</p>
                  <p className="text-lg font-semibold">{typeof analysis.results.chi_square.statistic === 'number' ? analysis.results.chi_square.statistic.toLocaleString(undefined, { maximumFractionDigits: 2 }) : analysis.results.chi_square.statistic}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">P-value</p>
                  <p className="text-lg font-semibold">{typeof analysis.results.chi_square.p_value === 'number' ? analysis.results.chi_square.p_value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : analysis.results.chi_square.p_value}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } else if (analysis.analysis_type === 'descriptive' && analysis.results?.descriptive_stats) {
      const stats = analysis.results.descriptive_stats as Record<string, unknown>;
      const statKeys = Object.keys(stats);
      // Prepare data for chart (if numeric)
      const numericKeys = statKeys.filter(k => typeof stats[k] === 'number' && !isNaN(stats[k] as number));
      const chartData = numericKeys.map(k => ({ name: k, value: stats[k] as number }));
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Descriptive Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            {statKeys.map((stat) => {
              const value = stats[stat];
              return (
                <div key={stat} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{stat.replace('_', ' ')}</p>
                  <p className="text-lg font-semibold">
                    {value !== undefined && value !== null && value !== '' ?
                      (typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value))
                      : 'N/A'}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Chart type selector and chart rendering */}
          {numericKeys.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium">Chart type:</span>
                {chartTypes.map((ct) => (
                  <button
                    key={ct.value}
                    className={`px-3 py-1 rounded border ${selectedChartType === ct.value ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                    onClick={() => setSelectedChartType(ct.value as 'bar' | 'line' | 'pie')}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
              <div className="bg-white p-4 rounded shadow">
                {selectedChartType === 'bar' && (
                  <BarChart width={400} height={250} data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                )}
                {selectedChartType === 'line' && (
                  <LineChart width={400} height={250} data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                )}
                {selectedChartType === 'pie' && (
                  <PieChart width={400} height={250}>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.status === 'error'
                  ? 'bg-red-100 text-red-800'
                  : message.status === 'loading'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
              {message.progress && (
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span>{message.progress}</span>
                  </div>
                </div>
              )}
              {message.analysis && (
                <button
                  onClick={() => setSelectedVisualization(message.analysis || null)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  View Visualization
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedVisualization} onOpenChange={() => setSelectedVisualization(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="ai-agent-dialog-desc">
          <VisuallyHidden>
            <div id="ai-agent-dialog-desc">This dialog shows the results of your AI-powered data analysis, including tables and statistics.</div>
          </VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Analysis Results</DialogTitle>
          </DialogHeader>
          {selectedVisualization?.columns_used && (
            <div className="mb-4 text-sm text-gray-700">
              <strong>Columns used for this analysis:</strong> {selectedVisualization.columns_used.join(', ')}
            </div>
          )}
          {selectedVisualization && renderVisualization(selectedVisualization)}
        </DialogContent>
      </Dialog>

      <div className="border-t p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !dataFile || !dataFile.id}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAgentChat; 