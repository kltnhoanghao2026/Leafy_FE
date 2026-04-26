import { useQuery } from "@tanstack/react-query";

const PROVINCES_API = "https://provinces.open-api.vn/api/p/";

interface ProvinceItem {
  code: number;
  name: string;
}

export interface Province {
  code: string;
  name: string;
}

export function useProvinces() {
  const query = useQuery<Province[]>({
    queryKey: ["vn-provinces"],
    queryFn: async () => {
      const res = await fetch(PROVINCES_API);
      if (!res.ok) throw new Error("Failed to fetch provinces");
      const data: ProvinceItem[] = await res.json();
      return data.map((p) => ({ code: String(p.code), name: p.name }));
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const provinceMap = new Map<string, string>();
  if (query.data) {
    for (const p of query.data) {
      provinceMap.set(p.code, p.name);
    }
  }

  return {
    provinces: query.data ?? [],
    provinceMap,
    isLoading: query.isLoading,
  };
}
