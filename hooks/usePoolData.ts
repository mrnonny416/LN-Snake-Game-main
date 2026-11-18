import { useEffect, useState } from "react";

export function usePoolData() {
  const [pool, setPool] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPool = async () => {
      try {
        const res = await fetch("/api/pool");
        const data = await res.json();
        setPool(data.total || 0);
      } catch (error) {
        console.error("Error fetching pool:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPool();
    // Refresh pool every 30 seconds
    const interval = setInterval(fetchPool, 30000);
    return () => clearInterval(interval);
  }, []);

  return { pool, loading };
}
