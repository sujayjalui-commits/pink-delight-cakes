import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..", "..");
const inputPath = path.join(projectRoot, "database", "seeds", "phase-1-seed.json");
const outputPath = path.join(projectRoot, "database", "seeds", "phase-1-seed.sql");

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  return Number.isFinite(value) ? String(value) : "NULL";
}

function sqlBoolean(value) {
  return value ? "1" : "0";
}

function buildProductOptionStatements(product) {
  const statements = [];
  let sortOrder = 1;

  for (const flavor of product.flavors || []) {
    statements.push(`INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'flavor', ${sqlString(flavor)}, NULL, NULL, ${sortOrder}
FROM products WHERE slug = ${sqlString(product.slug)};`);
    sortOrder += 1;
  }

  sortOrder = 1;

  for (const size of product.sizes || []) {
    statements.push(`INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'size', ${sqlString(size.label)}, ${sqlNumber(size.price)}, ${sqlString(size.servings)}, ${sortOrder}
FROM products WHERE slug = ${sqlString(product.slug)};`);
    sortOrder += 1;
  }

  sortOrder = 1;

  for (const addOn of product.addOns || []) {
    statements.push(`INSERT INTO product_options (product_id, option_group, option_label, price, servings, sort_order)
SELECT id, 'addon', ${sqlString(addOn)}, NULL, NULL, ${sortOrder}
FROM products WHERE slug = ${sqlString(product.slug)};`);
    sortOrder += 1;
  }

  return statements;
}

async function main() {
  const rawSeed = await readFile(inputPath, "utf8");
  const seed = JSON.parse(rawSeed);

  const statements = [
    "-- Generated from database/seeds/phase-1-seed.json",
    "DELETE FROM payments;",
    "DELETE FROM order_requests;",
    "DELETE FROM product_options;",
    "DELETE FROM products;",
    "DELETE FROM admin_users;",
    "DELETE FROM business_settings;",
    `INSERT INTO business_settings (
  brand_name,
  contact_email,
  contact_phone,
  instagram_handle,
  city,
  currency,
  payment_mode,
  inquiry_channel
) VALUES (
  ${sqlString(seed.businessSettings.brandName)},
  ${sqlString(seed.businessSettings.contactEmail)},
  ${sqlString(seed.businessSettings.contactPhone)},
  ${sqlString(seed.businessSettings.instagramHandle)},
  ${sqlString(seed.businessSettings.city)},
  ${sqlString(seed.businessSettings.currency)},
  ${sqlString(seed.businessSettings.paymentMode)},
  ${sqlString(seed.businessSettings.inquiryChannel)}
);`,
    `INSERT INTO admin_users (email, role, is_active)
VALUES (${sqlString(seed.adminUser.email)}, ${sqlString(seed.adminUser.role)}, 1);`
  ];

  for (const product of seed.products) {
    statements.push(`INSERT INTO products (
  slug,
  name,
  category,
  short_description,
  starting_price,
  badge,
  lead_time_hours,
  availability_status,
  featured,
  image_url
) VALUES (
  ${sqlString(product.slug)},
  ${sqlString(product.name)},
  ${sqlString(product.category)},
  ${sqlString(product.shortDescription)},
  ${sqlNumber(product.startingPrice)},
  ${sqlString(product.badge)},
  ${sqlNumber(product.leadTimeHours)},
  ${sqlString(product.availabilityStatus)},
  ${sqlBoolean(product.featured)},
  NULL
);`);

    statements.push(...buildProductOptionStatements(product));
  }

  statements.push("");

  await writeFile(outputPath, statements.join("\n\n"), "utf8");
  console.log(`Seed SQL written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
