import { useState } from 'react';
import { StatisticalTestResult, StatisticalTestOptions, CrossTabWithStats } from '../types/statistical';
import axios from 'axios';

export const useStatisticalTests = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const performTest = async (
        data: CrossTabWithStats,
        options: StatisticalTestOptions
    ): Promise<StatisticalTestResult | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/statistical-test', {
                data,
                options
            });

            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during statistical testing');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        performTest,
        loading,
        error
    };
}; 