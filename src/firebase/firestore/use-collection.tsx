'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, CollectionReference } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = any>(query: Query | CollectionReference | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

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
        const path = 'path' in query ? query.path : (query as any)._query?.path?.segments?.join('/') || 'unknown';
        const permissionError = new FirestorePermissionError({
          path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query ? JSON.stringify(query) : null]);

  return { data, loading, error };
}
