import { describe, expect, it } from "vitest";
import { TABLE_STICKY_HEADER_WRAP_CLASS } from "./table-sticky-styles";

describe("table-sticky-styles (REQ-0231)", () => {
  it("pins header cells inside a Y-scroll wrapper with an opaque background", () => {
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain("overflow-auto");
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain("overscroll-contain");
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain("max-h-[min(50vh,18rem)]");
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain("[&_thead_th]:sticky");
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain("[&_thead_th]:top-0");
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain("[&_thead_th]:bg-white");
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain(
      "dark:[&_thead_th]:bg-stone-900",
    );
  });

  it("uses box-shadow for the stuck divider so height does not change on stick", () => {
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).toContain("shadow-[0_3px_8px_-2px");
    expect(TABLE_STICKY_HEADER_WRAP_CLASS).not.toContain("border-b-2");
  });
});
