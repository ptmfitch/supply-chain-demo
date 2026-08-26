/**
 * SCD-15 — admin portal directory row types.
 * Client directory: per client user order/invoice counts + revenue.
 * Supplier directory: per supplier entity product count + inventory value.
 */

export interface ClientDirectoryRow {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  joinedAt: string;
  orderCount: number;
  invoiceCount: number;
  /** Sum of order totals excluding cancelled orders */
  totalRevenue: number;
  /** Latest order or invoice createdAt; null when no activity */
  lastActivityAt: string | null;
}

export interface SupplierDirectoryRow {
  supplierId: string;
  /** Linked User id (null when the supplier entity has no linked account) */
  userId: string | null;
  name: string;
  email: string | null;
  image: string | null;
  joinedAt: string;
  productCount: number;
  /** Sum of price × quantity across the supplier's products */
  inventoryValue: number;
  /** Distinct orders containing the supplier's products */
  orderCount: number;
  /** Latest order line or product createdAt; null when no activity */
  lastActivityAt: string | null;
}
