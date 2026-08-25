/**
 * Admin Client Portal query hooks
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys, withInitialData } from "@/lib/react-query";
import type { ClientDirectoryRow, ClientPortalStats } from "@/types";

export function useClientPortal(initialData?: ClientPortalStats) {
  return useQuery({
    queryKey: queryKeys.clientPortal.overview(),
    queryFn: async () => {
      const response = await apiClient.clientPortal.getOverview();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}

/** SCD-15 — full client directory (counts, revenue, last activity per client). */
export function useClientPortalDirectory(initialData?: ClientDirectoryRow[]) {
  return useQuery({
    queryKey: queryKeys.clientPortal.directory(),
    queryFn: async () => {
      const response = await apiClient.clientPortal.getDirectory();
      return response.data;
    },
    ...withInitialData(initialData),
  });
}
