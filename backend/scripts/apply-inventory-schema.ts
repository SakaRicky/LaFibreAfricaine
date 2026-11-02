import "dotenv/config";
import { readFile } from "node:fs/promises";
import { prisma } from "../src/prisma.js";
try {
 await prisma.$transaction(async tx => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(73519021)`;
  const tables = await tx.$queryRaw<{exists:boolean}[]>`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema=current_schema() AND table_name='orders') AS exists`;
  if (!tables[0]?.exists) return; // Fresh databases are initialized by prisma db push.
  const columns = await tx.$queryRaw<{exists:boolean}[]>`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='orders' AND column_name='payment_status') AS exists`;
  if (columns[0]?.exists) return;
  const sql=await readFile(new URL("../prisma/inventory-upgrade.sql",import.meta.url),"utf8");
  for(const statement of sql.split(";").map(s=>s.trim()).filter(Boolean)) await tx.$executeRawUnsafe(statement);
 },{timeout:30000});
 console.log("Inventory schema ready.");
} finally {await prisma.$disconnect();}
