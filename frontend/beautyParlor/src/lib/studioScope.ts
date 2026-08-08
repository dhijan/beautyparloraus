import { useEffect, useState } from "react";

const SCOPE_KEY = "bbh_studio_scope";

/**
 * Which studio the console is looking at. Kept in localStorage so the scope
 * survives moving between views, the way the single-page design does.
 */
export function useStudioScope() {
  const [studio, setStudio] = useState(
    () => localStorage.getItem(SCOPE_KEY) || "all"
  );

  useEffect(() => {
    localStorage.setItem(SCOPE_KEY, studio);
  }, [studio]);

  return [studio, setStudio] as const;
}
