import { useEffect, useRef } from "react";

/**
 * A custom hook to prevent duplicate API calls for list/paginated endpoints,
 * specifically handling React Strict Mode and redundant dependency updates.
 * 
 * @param fetchFn The function that triggers the API call
 * @param dependencies The parameters or filters that should trigger a re-fetch when changed
 */
export function useFetchList(fetchFn: () => void, dependencies: any) {
  const prevDepsRef = useRef<string | null>(null);
  const depsString = JSON.stringify(dependencies);

  useEffect(() => {
    if (prevDepsRef.current === depsString) return;
    
    prevDepsRef.current = depsString;
    fetchFn();
  }, [fetchFn, depsString]);
}
