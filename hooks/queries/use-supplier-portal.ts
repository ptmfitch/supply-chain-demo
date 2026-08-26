/**
 * Admin Supplier Portal query hooks
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { SupplierDirectoryRow, SupplierPortalStats } from "@/types";

export function useSupplierPortal(initialData?: SupplierPortalStats) {
  return useQuery({
    queryKey: queryKeys.supplierPortal.overview(),
    queryFn: async () => {
      const response = await apiClient.supplierPortal.getOverview();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/** SCD-15 — full supplier directory (products, inventory value, orders per supplier). */
export function useSupplierPortalDirectory(
  initialData?: SupplierDirectoryRow[],
) {
  return useQuery({
    queryKey: queryKeys.supplierPortal.directory(),
    queryFn: async () => {
      const response = await apiClient.supplierPortal.getDirectory();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}
