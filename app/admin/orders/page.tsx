import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Admin orders twin — redirect to the single store list. */
export default async function AdminOrdersPage({
  searchParams,
}: Props) {
  redirectWithSearch("/orders", await searchParams);
}
