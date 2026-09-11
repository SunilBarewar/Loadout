import { neon } from "@neondatabase/serverless";
import { EQUIPMENT_CATALOG } from "./equipment-catalog.mjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);

let inserted = 0;
let updated = 0;

for (const item of EQUIPMENT_CATALOG) {
  const rows = await sql`
    INSERT INTO equipment (slug, name, category)
    VALUES (${item.slug}, ${item.name}, ${item.category})
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        category = EXCLUDED.category
    RETURNING (xmax = 0) AS inserted
  `;

  if (rows[0]?.inserted) {
    inserted += 1;
  } else {
    updated += 1;
  }
}

const [{ count }] = await sql`
  SELECT COUNT(*)::int AS count FROM equipment
`;

console.log(
  `Equipment seed complete: ${inserted} inserted, ${updated} updated (${count} total in catalog).`
);
