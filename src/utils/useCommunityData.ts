import { useCallback, useEffect, useState } from "react";
import { CommunityData, fetchCommunityData } from "./communityData";

export function useCommunityData() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setData(await fetchCommunityData());
      setErrorKey(null);
    } catch (error) {
      setErrorKey(error instanceof Error ? error.message : "companion.error.load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, errorKey, reload };
}
