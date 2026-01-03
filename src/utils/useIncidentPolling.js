import { useState, useEffect, useRef, useCallback } from 'react';
import { getIncidentDetail } from '@/utils/api';

/**
 * Hook for polling incident status
 * Polls incident details at specified intervals
 */
export const useIncidentPolling = (incidentId, pollInterval = 5000) => {
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollTimeoutRef = useRef(null);

  const pollIncident = useCallback(async () => {
    if (!incidentId) return;

    setIsLoading(true);
    try {
      const data = await getIncidentDetail(incidentId);
      setIncident(data);
      setError(null);

      // Stop polling if incident is resolved
      if (data.status === 'RESOLVED') {
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
        }
      }
    } catch (err) {
      setError({
        status: err.status || 500,
        message: err.message || 'Failed to fetch incident details',
        type: err.type || 'ERROR',
        detail: err.detail,
      });
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  // Start polling on mount
  useEffect(() => {
    if (!incidentId) return;

    // Poll immediately
    pollIncident();

    // Set up interval polling
    const setupPolling = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      pollTimeoutRef.current = setTimeout(() => {
        pollIncident().then(() => {
          setupPolling();
        });
      }, pollInterval);
    };

    setupPolling();

    // Cleanup
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [incidentId, pollInterval, pollIncident]);

  return {
    incident,
    isLoading,
    error,
    refetch: pollIncident,
  };
};

export default useIncidentPolling;
