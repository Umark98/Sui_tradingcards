import { useState, useEffect, useCallback } from 'react';

interface UseMetadataReturn {
  metadata: Record<string, any>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFrontendMetadata(): UseMetadataReturn {
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/frontend-metadata-ids');
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
        console.log(`Loaded ${Object.keys(data).length} frontend metadata entries`);
      } else {
        setError(`Failed to load frontend metadata: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load frontend metadata: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load metadata on mount
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: loadMetadata
  };
}

export function useDisplayMetadata(): UseMetadataReturn {
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/metadata-ids');
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
        console.log(`Loaded ${Object.keys(data).length} display metadata entries`);
      } else {
        setError(`Failed to load display metadata: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load display metadata: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load metadata on mount
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: loadMetadata
  };
}

export function useAvailableCardTypes(): UseMetadataReturn {
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all available card types from metadata-ids.json
      const response = await fetch('/api/admin/metadata-ids');
      if (response.ok) {
        const allCardTypes = await response.json();
        
        // Load existing frontend metadata to filter out already created ones
        const frontendResponse = await fetch('/api/admin/frontend-metadata-ids');
        let existingFrontendMetadata = {};
        if (frontendResponse.ok) {
          existingFrontendMetadata = await frontendResponse.json();
        }
        
               // Filter out card types that already have frontend metadata
               const filteredCardTypes = Object.keys(allCardTypes).reduce((acc: Record<string, any>, cardType) => {
                 if (!(existingFrontendMetadata as Record<string, any>)[cardType]) {
                   acc[cardType] = allCardTypes[cardType];
                 }
                 return acc;
               }, {} as Record<string, any>);
        
        setMetadata(filteredCardTypes);
        console.log(`Loaded ${Object.keys(filteredCardTypes).length} available card types for metadata creation (filtered out ${Object.keys(existingFrontendMetadata).length} existing)`);
      } else {
        setError(`Failed to load display metadata: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load available card types: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load metadata on mount
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: loadMetadata
  };
}
