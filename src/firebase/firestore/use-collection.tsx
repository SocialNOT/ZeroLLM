'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, CollectionReference } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

/**
 * A stable real-time listener hook for Firestore collections.
 * Implements standard Pattern 2 for error emission.
 */
export function useCollection<T = any>(query: Query | CollectionReference | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    // Pattern 2: Real-time listener with async error callback
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      async (serverError) => {
        // Construct contextual error for the development overlay
        const path = 'path' in query ? query.path : (query as any)._query?.path?.segments?.join('/') || 'unknown';
        const permissionError = new FirestorePermissionError({
          path,
          operation: 'list',
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]); // Ref reference stability is handled by the caller via useMemoFirebase

  return { data, loading, error };
}
