import { useState, useEffect, useCallback } from 'react';

export function useChatMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  return { materials, isLoading, error };
}
