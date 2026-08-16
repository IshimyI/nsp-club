import { useEffect } from "react";

// The SPA fallback always returns HTTP 200, so a client-only "not found"
// state would otherwise read as a valid page to any crawler that executes
// JS — this meta tag is the standard mitigation for that soft-404 case.
export default function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}
