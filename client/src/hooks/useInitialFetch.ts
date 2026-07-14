import { useEffect, useRef } from "react";

/**
 * A custom hook to execute functions exactly once on component mount.
 * Useful for preventing duplicate API calls caused by React Strict Mode or layout re-renders.
 */
export const useInitialFetch = (fetchFn: () => void) => {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchFn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
