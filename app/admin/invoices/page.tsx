import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Admin invoices twin — redirect to the single store list. */
export default async function AdminInvoicesPage({
  searchParams,
}: Props) {
  redirectWithSearch("/invoices", await searchParams);
}
