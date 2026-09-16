import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Admin warehouse detail twin — redirect to store detail. */
export default async function AdminWarehouseDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  redirectWithSearch(`/warehouses/${id}`, await searchParams);
}
