import { useEffect } from "react";

const SITE_ORIGIN = "https://nsp-club.ru";

// One canonical <link> for the whole app, kept in sync with the route
// pathname (query strings — catalog filters/sort — are deliberately
// excluded so all filtered views of the same listing canonicalize to one URL).
export default function useCanonical(pathname) {
  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]');
    let created = false;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
      created = true;
    }
    link.href = `${SITE_ORIGIN}${pathname}`;
    return () => {
      if (created) document.head.removeChild(link);
    };
  }, [pathname]);
}
