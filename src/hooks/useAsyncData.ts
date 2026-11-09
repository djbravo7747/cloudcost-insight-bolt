import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useAsyncData<T>(loader: () => Promise<T>, dependencies: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    loader()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Something went wrong while loading this data.';
        setState({ data: null, error: message, loading: false });
      });
    return () => {
      active = false;
    };
    // The caller controls when the loader should re-run through its dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...state, reload };
}
