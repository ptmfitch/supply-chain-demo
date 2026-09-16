import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy Personal Invoice detail — redirect to store invoice detail. */
export default async function AdminPersonalInvoiceDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  redirectWithSearch(`/invoices/${id}`, await searchParams);
}
