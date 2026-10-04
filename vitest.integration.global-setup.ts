function testDatabaseName(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const pathname = parsed.pathname.replace(/^\/+/, "");
  return pathname.split("/")[0] ?? "";
}

export default function integrationGlobalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Integration tests require DATABASE_URL.");
  }
  const databaseName = testDatabaseName(databaseUrl);
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Refusing integration tests against "${databaseName}". DATABASE_URL must target a *_test database.`,
    );
  }
}
