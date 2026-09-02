import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Admin product detail twin — redirect to store detail. */
export default async function AdminProductDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  redirectWithSearch(`/products/${id}`, await searchParams);
}
