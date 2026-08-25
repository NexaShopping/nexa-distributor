import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  isActive?: boolean;
}

export function useCatalogCategories() {
  return useQuery({
    queryKey: ["catalog-categories"],
    queryFn: () => api.get<{ categories: CatalogCategory[] }>("/categories?isActive=true"),
    staleTime: 5 * 60 * 1000,
  });
}
