import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";

const migrationDir = new URL("../../database/migrations/", import.meta.url);
const migrationSql = readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort()
  .map((name) => readFileSync(new URL(name, migrationDir), "utf8")).join("\n");

const seedTables = {
  products: "products", productOptions: "product_options", orderRequests: "order_requests",
  orderStatusHistory: "order_request_status_history", adminUsers: "admin_users",
  testimonials: "testimonials", rateLimitEvents: "rate_limit_events"
};

class Statement {
  constructor(database, query, bindings = []) { Object.assign(this, { database, query, bindings }); }
  bind(...bindings) { return new Statement(this.database, this.query, bindings); }
  async first() { return this.database.execute(this).results[0] || null; }
  async all() { return this.database.execute(this); }
  async run() { return this.database.execute(this); }
}

// Real SQLite statements and transactional batches, shaped like D1's API.
// Await boundaries allow concurrent service requests to read the same version.
export class SqliteD1Database {
  constructor(seed = {}) {
    // Historical migrations use SQLite's legacy double-quoted string literals.
    this.sqlite = new DatabaseSync(":memory:", { enableDoubleQuotedStringLiterals: true });
    this.sqlite.exec(migrationSql);
    this.sqlite.exec("PRAGMA foreign_keys=OFF");
    for (const table of Object.values(seedTables)) this.sqlite.exec(`DELETE FROM ${table}`);
    this.sqlite.exec("DELETE FROM business_settings; DELETE FROM sqlite_sequence");
    for (const [name, table] of Object.entries(seedTables)) {
      for (const row of seed[name] || []) this.insertFixture(table, row);
    }
    if (seed.businessSettings) this.insertFixture("business_settings", seed.businessSettings);
    // Older HTTP fixtures refer to a product without including its row.
    for (const order of seed.orderRequests || []) {
      if (order.product_id && !this.sqlite.prepare("SELECT id FROM products WHERE id=?").get(order.product_id)) {
        this.insertFixture("products", { id: order.product_id, slug: `fixture-${order.product_id}`,
          name: "Fixture cake", category: "birthday", short_description: "Fixture", starting_price: 100,
          lead_time_hours: 24, availability_status: "available" });
      }
    }
    this.sqlite.exec("PRAGMA foreign_keys=ON");
    this.queryLog = [];
    this.beforeBatch = null;
  }
  insertFixture(table, row) {
    const columns = Object.keys(row);
    this.sqlite.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`)
      .run(...Object.values(row));
  }
  prepare(query) { return new Statement(this, query); }
  execute(statement) {
    this.queryLog.push({ query: statement.query.replace(/\s+/g, " ").trim().toLowerCase(), boundValues: statement.bindings });
    const prepared = this.sqlite.prepare(statement.query);
    const results = prepared.columns().length ? prepared.all(...statement.bindings).map((row) => ({ ...row })) : [];
    if (!prepared.columns().length) prepared.run(...statement.bindings);
    return { success: true, results, meta: { changes: this.sqlite.prepare("SELECT changes() AS n").get().n } };
  }
  async batch(statements) {
    if (this.beforeBatch) await this.beforeBatch(statements);
    this.sqlite.exec("BEGIN");
    try {
      const results = statements.map((statement) => this.execute(statement));
      this.sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
  close() { this.sqlite.close(); }
}
for (const [name, table] of Object.entries(seedTables)) {
  Object.defineProperty(SqliteD1Database.prototype, name, {
    get() { return this.sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map((row) => ({ ...row })); }
  });
}
Object.defineProperty(SqliteD1Database.prototype, "businessSettings", {
  get() { return this.sqlite.prepare("SELECT * FROM business_settings ORDER BY id LIMIT 1").get(); }
});

export function createExecutionContext() {
  return { tasks: [], waitUntil(promise) { this.tasks.push(promise); } };
}

export function createTestEnv(seed = {}) {
  return {
    DB: new SqliteD1Database(seed),
    ADMIN_SESSION_SECRET: "test-admin-session-secret", ADMIN_SETUP_KEY: "test-setup-key",
    SITE_URL: "https://pink-delight-cakes.pages.dev", ADMIN_URL: "https://pink-delight-cakes.pages.dev/admin/",
    API_BASE_URL: "https://pink-delight-cakes-api.sujayjalui.workers.dev",
    CORS_ALLOWED_ORIGINS: "https://pink-delight-cakes.pages.dev"
  };
}
