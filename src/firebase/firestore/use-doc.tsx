'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentReference } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T = any>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null);
        setLoading(false);
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref?.path]);

  return { data, loading, error };
}
