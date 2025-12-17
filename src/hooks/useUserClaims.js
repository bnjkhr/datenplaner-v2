// src/hooks/useUserClaims.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook zum Lesen der Custom Claims eines Firebase Users
 * Gibt isAdmin, claims und loading-Status zurück
 */
export const useUserClaims = (user) => {
  const [claims, setClaims] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const initialLoadRef = useRef(true);

  const refreshClaims = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setClaims(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Force refresh on initial load to get latest claims from server
      const tokenResult = await user.getIdTokenResult(forceRefresh);
      const customClaims = tokenResult.claims || {};

      if (mountedRef.current) {
        setClaims(customClaims);
        setIsAdmin(customClaims.admin === true);
      }
    } catch (error) {
      console.error('Error fetching user claims:', error);
      if (mountedRef.current) {
        setClaims(null);
        setIsAdmin(false);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // Fetch claims when user changes - force refresh on initial load
  useEffect(() => {
    mountedRef.current = true;
    const shouldForceRefresh = initialLoadRef.current;
    initialLoadRef.current = false;
    refreshClaims(shouldForceRefresh);

    return () => {
      mountedRef.current = false;
    };
  }, [refreshClaims]);

  return {
    claims,
    isAdmin,
    loading,
    refreshClaims
  };
};

export default useUserClaims;
