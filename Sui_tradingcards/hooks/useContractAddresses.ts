import { useState, useEffect, useCallback } from 'react';

interface ContractAddresses {
  packageId: string;
  adminCapId: string;
  publisherId?: string;
}

interface UseContractAddressesReturn {
  contractAddresses: ContractAddresses | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContractAddresses(): UseContractAddressesReturn {
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContractAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/contract-addresses');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.contractAddresses) {
          setContractAddresses({
            packageId: data.contractAddresses.packageId,
            adminCapId: data.contractAddresses.adminCapId,
            publisherId: data.contractAddresses.publisherId
          });
          console.log(`Contract addresses loaded from ${data.source}`);
        } else {
          setError('Failed to load contract addresses');
        }
      } else {
        setError(`Failed to load contract addresses: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load contract addresses: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContractAddresses();
  }, [loadContractAddresses]);

  return {
    contractAddresses,
    loading,
    error,
    refetch: loadContractAddresses
  };
}
