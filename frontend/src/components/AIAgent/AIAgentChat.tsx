import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useData } from '@/contexts/data-context';
import { CrossTabResult, AgentResponse } from '@/types/analysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

const CommunicationGuide: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">How to Use the AI Assistant</h2>
      
      <Tabs defaultValue="examples" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
          <TabsTrigger value="code">Code Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="examples" className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="multiple-response">
              <AccordionTrigger>Multiple-Response Analysis</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="font-medium">Example Prompts:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>"Show me the distribution of all selected responses for the 'Which social media platforms do you use?' question"</li>
                    <li>"Create a crosstab of all selected brands against age groups"</li>
                    <li>"What percentage of respondents selected each combination of features?"</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="custom-variables">
              <AccordionTrigger>Custom Variables & Recodes</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="font-medium">Example Prompts:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>"Combine the 'Very Satisfied' and 'Satisfied' responses into a single 'Positive' category"</li>
                    <li>"Create a new variable that groups ages into 'Young', 'Middle', and 'Senior'"</li>
                    <li>"Recode the income brackets into three categories: Low, Medium, High"</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="statistical-tests">
              <AccordionTrigger>Advanced Statistical Tests</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="font-medium">Example Prompts:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>"Compare the satisfaction scores between regions using t-tests"</li>
                    <li>"Show me if there are significant differences in brand preference by age group"</li>
                    <li>"Calculate the median income for each education level"</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Multiple-Response Analysis</h3>
              <p className="text-sm text-gray-600">Analyze multiple selected responses and their combinations</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Custom Variables</h3>
              <p className="text-sm text-gray-600">Create new variables by combining or recoding existing ones</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Statistical Testing</h3>
              <p className="text-sm text-gray-600">Perform appropriate tests based on variable types</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Report Generation</h3>
              <p className="text-sm text-gray-600">Generate formatted reports with tables and charts</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="best-practices" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Be Specific</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Clearly state what you want to analyze</li>
                <li>Specify the variables of interest</li>
                <li>Define any conditions or filters</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Use Natural Language</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Ask questions as you would to a human analyst</li>
                <li>Provide context when needed</li>
                <li>Don't hesitate to ask for clarification</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Request Verification</h3>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                <li>Ask the agent to confirm its understanding</li>
                <li>Request explanation of the methodology</li>
                <li>Ask for alternative approaches</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="multiple-response-code">
              <AccordionTrigger>Multiple-Response Example</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`const request = {
  file_id: 123,
  query: "Show distribution of social media platforms by age group",
  context: {
    multiple_response_vars: ["social_media_platforms"],
    row_vars: ["age_group"],
    col_vars: ["social_media_platforms"]
  }
};`}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="custom-variables-code">
              <AccordionTrigger>Custom Variables Example</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`const request = {
  file_id: 123,
  query: "Recode satisfaction into positive/negative",
  context: {
    custom_variables: [{
      name: "satisfaction_recoded",
      conditions: [
        {
          column: "satisfaction",
          comparison: "equals",
          value: "Very Satisfied",
          operator: "OR"
        },
        {
          column: "satisfaction",
          comparison: "equals",
          value: "Satisfied"
        }
      ],
      new_value: "Positive"
    }]
  }
};`}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="statistical-tests-code">
              <AccordionTrigger>Statistical Tests Example</AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`const request = {
  file_id: 123,
  query: "Compare satisfaction by region",
  context: {
    statistical_tests: {
      type: "anova",
      variables: ["satisfaction", "region"],
      significance_level: 0.05
    }
  }
};`}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
};

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
    console.log('Rendering visualization with data:', analysis);
    
    if (analysis.analysis_type === 'distribution' && analysis.results?.distribution) {
        const { counts, percentages } = analysis.results.distribution;
        const data = Object.entries(counts).map(([value, count]) => ({
            value: value.toString(),
            count: count as number,
            percentage: percentages[value] as number
        }));
        
        return (
            <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Distribution</h3>
                    <div className="space-y-2">
                        {data.map(({ value, count, percentage }) => (
                            <div key={value} className="flex items-center justify-between">
                                <span className="font-medium">{value}</span>
                                <span>{count} ({percentage}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Bar Chart</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="value" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: number) => [`${value}`, 'Count']}
                                    labelFormatter={(label) => `Value: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="count" name="Count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {analysis.results.statistics?.chi_square && (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-4">Chi-Square Test Results</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Statistic:</span>
                                <span>{analysis.results.statistics.chi_square.statistic.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>p-value:</span>
                                <span>{analysis.results.statistics.chi_square.p_value.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Result:</span>
                                <span className={analysis.results.statistics.chi_square.significant ? 'text-green-600' : 'text-red-600'}>
                                    {analysis.results.statistics.chi_square.significance}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    if (analysis.analysis_type === 'crosstab' && analysis.results?.table) {
      const { data, variable_types } = analysis.results.table;
      const rowLabels = Object.keys(data);
      const columnLabels = Object.keys(data[rowLabels[0]]);
      
      return (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Variable Types</h3>
            <p>Row Variable: {variable_types?.row || 'unknown'}</p>
            <p>Column Variable: {variable_types?.column || 'unknown'}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted"></th>
                  {columnLabels.map((col) => (
                    <th key={col} className="border p-2 bg-muted">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowLabels.map((row) => (
                  <tr key={row}>
                    <td className="border p-2 font-medium bg-muted">{row}</td>
                    {columnLabels.map((col) => (
                      <td key={col} className="border p-2 text-right">
                        {data[row][col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {analysis.results.statistics && (
            <div className="space-y-4">
              <h3 className="font-semibold">Statistical Analysis</h3>
              
              {/* Chi-Square Test Results */}
              {analysis.results.statistics.chi_square && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Chi-Square Test</h4>
                  <p>Statistic: {analysis.results.statistics.chi_square.statistic.toFixed(3)}</p>
                  <p>p-value: {analysis.results.statistics.chi_square.p_value.toFixed(3)}</p>
                  <p>Degrees of Freedom: {analysis.results.statistics.chi_square.degrees_of_freedom}</p>
                  <p className="font-medium">
                    Result: {analysis.results.statistics.chi_square.significance}
                  </p>
                </div>
              )}

              {/* Cramer's V Results */}
              {analysis.results.statistics.cramer_v && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Cramer's V</h4>
                  <p>Value: {analysis.results.statistics.cramer_v.value.toFixed(3)}</p>
                  <p>Interpretation: {analysis.results.statistics.cramer_v.interpretation} association</p>
                </div>
              )}

              {/* ANOVA Results */}
              {analysis.results.statistics.anova && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">ANOVA Test</h4>
                  <p>F-statistic: {analysis.results.statistics.anova.statistic.toFixed(3)}</p>
                  <p>p-value: {analysis.results.statistics.anova.p_value.toFixed(3)}</p>
                  <p className="font-medium">
                    Result: {analysis.results.statistics.anova.significance}
                  </p>
                </div>
              )}

              {/* Correlation Results */}
              {analysis.results.statistics.correlation && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Correlation Analysis</h4>
                  <p>Coefficient: {analysis.results.statistics.correlation.coefficient.toFixed(3)}</p>
                  <p>p-value: {analysis.results.statistics.correlation.p_value.toFixed(3)}</p>
                  <p>Interpretation: {analysis.results.statistics.correlation.interpretation} correlation</p>
                  <p className="font-medium">
                    Result: {analysis.results.statistics.correlation.significance}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else if (analysis.analysis_type === 'descriptive' && analysis.results?.descriptive_stats) {
      const stats = analysis.results.descriptive_stats;
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Descriptive Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                <p className="text-lg font-semibold">
                  {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <CommunicationGuide />
        
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Results</DialogTitle>
            <DialogDescription>
              This dialog shows the results of your AI-powered data analysis, including tables and statistics.
            </DialogDescription>
          </DialogHeader>
          {selectedVisualization?.columns_used && (
            <div className="mb-4 text-sm text-gray-700">
              <strong>Columns used for this analysis:</strong> {selectedVisualization.columns_used.join(', ')}
            </div>
          )}
          <div className="mt-4">
            {selectedVisualization && renderVisualization(selectedVisualization)}
          </div>
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