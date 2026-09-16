import { redirectWithSearch } from "@/lib/navigation/redirect-with-search";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Admin products twin — redirect to the single store list. */
export default async function AdminProductsPage({
  searchParams,
}: Props) {
  redirectWithSearch("/products", await searchParams);
}
