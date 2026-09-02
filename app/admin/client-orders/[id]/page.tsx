import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy Client Order detail — redirect to store order detail. */
export default async function AdminClientOrderDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  redirectWithSearch(`/orders/${id}`, await searchParams);
}
