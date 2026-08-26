# Requirements

## REQ-0231 — Admin table empty states (SCD-20)

- User Management, Support Tickets, Product Reviews, and Import History use one shared empty-state component.
- A truly empty list shows guidance and its create or product-import action.
- A filtered-out list shows “No matches” and resets search, filter chips, ticket view, and pagination.
- This is UI-only; query keys and invalidation behavior are unchanged.
