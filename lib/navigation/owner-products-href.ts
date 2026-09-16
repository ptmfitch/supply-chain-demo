/**
 * REQ-0164 / REQ-0166 — role-aware owner product list href (catalog detail + Parties & Roles).
 * Admin and store owners use the single /products list with ownerId filter.
 */

export function resolveOwnerProductsHref(
  ownerId: string,
  _isAdminRole: boolean,
): string | undefined {
  if (!ownerId) return undefined;
  return `/products?ownerId=${ownerId}`;
}
