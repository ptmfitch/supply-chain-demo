/**
 * Usage metrics live in their own database on the same MongoDB instance as the
 * app, so seeding or dropping them can never touch application data.
 *
 * Default name is the app database with a `_usage` suffix (`stockly` ->
 * `stockly_usage`); override with USAGE_DB_NAME. The connection URI is reused
 * as-is — only the database selected off the client changes.
 */

export const USAGE_DB_SUFFIX = "_usage";

/**
 * Database name from a MongoDB connection string, or null when the URI has none.
 * Parsed by hand rather than with `URL` so credentials containing reserved
 * characters cannot break it.
 */
export function parseMongoDbName(uri: string): string | null {
  const schemeEnd = uri.indexOf("://");
  if (schemeEnd === -1) return null;

  const afterScheme = uri.slice(schemeEnd + 3);
  // Credentials may contain "/", so start looking for the path after the host.
  const credentialsEnd = afterScheme.lastIndexOf("@");
  const hostAndPath =
    credentialsEnd === -1 ? afterScheme : afterScheme.slice(credentialsEnd + 1);

  const pathStart = hostAndPath.indexOf("/");
  if (pathStart === -1) return null;

  const path = hostAndPath.slice(pathStart + 1);
  const name = path.split(/[?#]/)[0] ?? "";
  return name.length > 0 ? name : null;
}

/**
 * Usage database name for the given app connection string.
 * @throws when the URI carries no database and USAGE_DB_NAME is unset.
 */
export function resolveUsageDbName(
  uri: string,
  override?: string | null,
): string {
  const explicit = override?.trim();
  if (explicit) return explicit;

  const appDbName = parseMongoDbName(uri);
  if (!appDbName) {
    throw new Error(
      "Cannot derive the usage database name: DATABASE_URL has no database path. " +
        "Add one (e.g. mongodb://localhost:27017/stockly) or set USAGE_DB_NAME.",
    );
  }

  return `${appDbName}${USAGE_DB_SUFFIX}`;
}
