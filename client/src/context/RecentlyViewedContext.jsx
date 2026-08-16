/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const RecentlyViewedContext = createContext(null);
const STORAGE_KEY = "nsp-club-recently-viewed";
const MAX_ITEMS = 8;

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function RecentlyViewedProvider({ children }) {
  const [slugs, setSlugs] = useState(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  }, [slugs]);

  const markViewed = (slug) => {
    setSlugs((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_ITEMS));
  };

  return (
    <RecentlyViewedContext.Provider value={{ slugs, markViewed }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return ctx;
}
