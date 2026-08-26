# Requirements

REQ IDs assigned from Jira stories in project **supply-chain-demo**. Architecture notes also live in `.cursor/rules/project-quick-reference.mdc`.

## REQ-0231 — Sticky headers on admin list tables (SCD-24)

| Piece | Location |
|-------|----------|
| Token | `lib/ui/table-sticky-styles.ts` — `TABLE_STICKY_HEADER_WRAP_CLASS` |
| Wrapper | `components/ui/table.tsx` — opt-in `stickyHeader` (catalog tables unchanged; REQ-0172 X-only default) |
| Wired | User / ticket / review / import-history admin list tables |
| Tests | `lib/ui/table-sticky-styles.test.ts` |

**Invalidation unchanged** — CSS/UI only. Header sticks inside the table scroll container with an opaque light/dark background and a box-shadow divider (no layout shift on stick).
