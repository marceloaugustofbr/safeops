import { db } from "../src/server/db";

async function main() {
  console.log("🌱 Seeding database...");

  const locations = [
    { name: "Mercado Livre", city: "Bauru", unit: "MLB Bauru" },
    { name: "Mercado Livre", city: "Ribeirão Preto", unit: "MLB Ribeirão" },
    { name: "Mercado Livre", city: "Campinas", unit: "MLB Campinas" },
  ];

  const createdLocations: Record<string, string> = {};
  for (const loc of locations) {
    const created = await db.location.upsert({
      where: {
        name_city_unit: {
          name: loc.name,
          city: loc.city,
          unit: loc.unit,
        },
      },
      update: {},
      create: loc,
    });
    createdLocations[created.city] = created.id;
  }
  console.log("✅ Locations seeded");

  const operations = [
    { name: "Service Center", city: "Bauru" },
    { name: "Crossdocking", city: "Ribeirão Preto" },
    { name: "Full", city: "Campinas" },
  ];

  for (const op of operations) {
    await db.operation.upsert({
      where: {
        name_locationId: {
          name: op.name,
          locationId: createdLocations[op.city]!,
        },
      },
      update: {},
      create: {
        name: op.name,
        locationId: createdLocations[op.city]!,
      },
    });
  }
  console.log("✅ Operations seeded");

  const reasons = [
    { name: "Primeira entrega", type: "DELIVERY" as const },
    { name: "Perda", type: "REMOVAL" as const },
    { name: "Danificado", type: "REMOVAL" as const },
    { name: "Troca", type: "REMOVAL" as const },
    { name: "Reposição", type: "DELIVERY" as const },
    { name: "Outro", type: "DELIVERY" as const },
  ];

  for (const reason of reasons) {
    await db.reason.upsert({
      where: {
        name_type: { name: reason.name, type: reason.type },
      },
      update: {},
      create: reason,
    });
  }
  console.log("✅ Reasons seeded");

  const epiNames = [
    "Luva de proteção SOFT540",
    "Colete refletivo",
    "Bota de proteção com metatarso",
    "Casquete",
    "Capacete de proteção",
    "Protetor Solar 60FPS",
    "Óculos escuro de proteção",
  ];

  for (const name of epiNames) {
    const exists = await db.epi.findFirst({ where: { name } });
    if (!exists) {
      await db.epi.create({ data: { name } });
    }
  }
  console.log("✅ EPIs seeded");

  const uniformNames = [
    "Camiseta",
    "Calça",
    "Jaqueta",
    "Moletom",
    "Boné",
    "Colete",
  ];

  for (const name of uniformNames) {
    const exists = await db.uniform.findFirst({ where: { name } });
    if (!exists) {
      await db.uniform.create({ data: { name } });
    }
  }
  console.log("✅ Uniforms seeded");

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
