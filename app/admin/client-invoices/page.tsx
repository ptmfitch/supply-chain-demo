import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy Client Invoices — redirect to combined store list. */
export default async function AdminClientInvoicesPage({
  searchParams,
}: Props) {
  redirectWithSearch("/invoices", await searchParams);
}
