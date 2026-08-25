/**
 * Shared nav link class builders (REQ-0094).
 * Navbar + AdminSidebar use the same active/inactive tokens for consistent feel.
 */
import { cn } from "@/lib/utils";

/** Desktop or mobile navbar item — pair with next/link prefetch. */
export function navbarNavLinkClass(
  isActive: boolean,
  variant: "desktop" | "mobile" = "desktop",
): string {
  const base =
    variant === "mobile"
      ? "inline-flex w-full items-center justify-start px-2 text-sm font-normal transition-all duration-300 ease-in-out hover:backdrop-blur-md h-auto min-h-[44px]"
      : "inline-flex items-center text-sm font-normal will-change-[background,box-shadow,color] transition-[background-image,box-shadow,color] duration-300 ease-in-out rounded-md px-2 py-2";

  if (isActive) {
    return cn(
      base,
      "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/45",
      variant === "desktop" && "shadow-sm",
    );
  }

  return cn(
    base,
    "text-gray-700 dark:text-muted-foreground hover:text-sky-600 dark:hover:text-foreground hover:bg-sky-100 dark:hover:bg-stone-800",
    variant === "desktop" && "hover:shadow-sm",
  );
}

/** Admin sidebar active-route check. Prefix match unless `exact` is set. */
export function isAdminSidebarPathActive(
  pathname: string | null,
  href: string,
  options?: { exact?: boolean },
): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (options?.exact || href === "/admin") return false;
  return pathname.startsWith(href);
}

/** Admin sidebar link — pathname-aware active state. */
export function adminSidebarLinkClass(
  pathname: string | null,
  href: string,
  options?: { isSub?: boolean; collapsed?: boolean; exact?: boolean },
): string {
  const isSub = options?.isSub ?? false;
  const collapsed = options?.collapsed ?? false;
  const isActive = isAdminSidebarPathActive(pathname, href, {
    exact: options?.exact,
  });

  return cn(
    "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-normal transition-colors",
    isSub && !collapsed ? "pl-8" : "",
    collapsed ? "justify-center px-0 w-9 h-9 mx-auto" : "",
    isActive
      ? "bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300"
      : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300",
  );
}
