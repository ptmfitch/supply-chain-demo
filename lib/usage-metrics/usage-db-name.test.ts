import { describe, expect, it } from "vitest";
import { parseMongoDbName, resolveUsageDbName } from "./usage-db-name";

describe("parseMongoDbName", () => {
  it("reads the database from local and SRV URIs", () => {
    expect(parseMongoDbName("mongodb://localhost:27017/stockly")).toBe(
      "stockly",
    );
    expect(
      parseMongoDbName("mongodb://localhost:27017/stockly?replicaSet=rs0"),
    ).toBe("stockly");
    expect(
      parseMongoDbName(
        "mongodb+srv://user:pass@cluster.mongodb.net/stockly?retryWrites=true&w=majority",
      ),
    ).toBe("stockly");
  });

  it("survives credentials containing reserved characters", () => {
    expect(
      parseMongoDbName("mongodb://user:p%2Fss%40word@host:27017/stockly"),
    ).toBe("stockly");
    expect(
      parseMongoDbName("mongodb://admin:a/b@host1:27017,host2:27017/stockly"),
    ).toBe("stockly");
  });

  it("returns null when the URI carries no database", () => {
    expect(parseMongoDbName("mongodb://localhost:27017")).toBeNull();
    expect(parseMongoDbName("mongodb://localhost:27017/")).toBeNull();
    expect(
      parseMongoDbName("mongodb://localhost:27017/?replicaSet=rs0"),
    ).toBeNull();
    expect(parseMongoDbName("not-a-uri")).toBeNull();
  });
});

describe("resolveUsageDbName", () => {
  it("suffixes the app database", () => {
    expect(resolveUsageDbName("mongodb://localhost:27017/stockly")).toBe(
      "stockly_usage",
    );
  });

  it("prefers a non-empty override", () => {
    expect(
      resolveUsageDbName("mongodb://localhost:27017/stockly", "nav_metrics"),
    ).toBe("nav_metrics");
    expect(resolveUsageDbName("mongodb://localhost:27017/stockly", "  ")).toBe(
      "stockly_usage",
    );
    expect(resolveUsageDbName("mongodb://localhost:27017/stockly", null)).toBe(
      "stockly_usage",
    );
  });

  it("throws an actionable error when neither source resolves", () => {
    expect(() => resolveUsageDbName("mongodb://localhost:27017")).toThrow(
      /USAGE_DB_NAME/,
    );
  });
});
