/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const CompareContext = createContext(null);
const MAX_COMPARE = 3;

export function CompareProvider({ children }) {
  const [slugs, setSlugs] = useState([]);

  const toggleCompare = (slug) => {
    setSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, slug];
    });
  };

  const clearCompare = () => setSlugs([]);
  const isComparing = (slug) => slugs.includes(slug);

  return (
    <CompareContext.Provider value={{ slugs, toggleCompare, clearCompare, isComparing, MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
