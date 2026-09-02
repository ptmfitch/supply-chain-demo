import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy Client Orders — redirect to combined store list. */
export default async function AdminClientOrdersPage({
  searchParams,
}: Props) {
  redirectWithSearch("/orders", await searchParams);
}
