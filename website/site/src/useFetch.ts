import { useEffect, useState } from "react";

interface State<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export function useFetch<T>(fn: () => Promise<T>, deps: unknown[]): State<T> {
  const [state, setState] = useState<State<T>>({ loading: true });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    fn()
      .then((data) => !cancelled && setState({ data, loading: false }))
      .catch(
        (e: unknown) =>
          !cancelled && setState({ error: String(e), loading: false }),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
