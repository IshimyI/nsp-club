import { useEffect, useState } from "react";
import { fetchRate } from "./api";

export default function useRate() {
  const [rub, setRub] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchRate().then((data) => {
      if (!cancelled && data?.rub) setRub(data.rub);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return rub;
}
