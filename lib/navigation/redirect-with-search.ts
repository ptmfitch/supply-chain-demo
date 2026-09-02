import { redirect } from "next/navigation";

type SearchParamValue = string | string[] | undefined;
type SearchParamsInput =
  | Record<string, SearchParamValue>
  | URLSearchParams
  | undefined;

function appendSearchParams(
  qs: URLSearchParams,
  searchParams: SearchParamsInput,
): void {
  if (!searchParams) return;
  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      qs.set(key, value);
    });
    return;
  }
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => qs.append(key, item));
    } else {
      qs.set(key, value);
    }
  }
}

/** Preserve query string when redirecting admin twin routes to store URLs. */
export function redirectWithSearch(
  targetPath: string,
  searchParams?: SearchParamsInput,
): never {
  const qs = new URLSearchParams();
  appendSearchParams(qs, searchParams);
  const query = qs.toString();
  redirect(query ? `${targetPath}?${query}` : targetPath);
}
