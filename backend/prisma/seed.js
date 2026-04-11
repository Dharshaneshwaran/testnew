require("dotenv/config");

const bcrypt = require("bcrypt");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, AlertCondition } = require("@prisma/client");

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set for seeding");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(connectionString),
  });

  try {
    const email = process.env.SEED_USER_EMAIL || "demo@tradeboard.pro";
    const password = process.env.SEED_USER_PASSWORD || "demo1234";
    const name = process.env.SEED_USER_NAME || "Demo Trader";
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
      },
      create: {
        email,
        name,
        passwordHash,
      },
    });

    await prisma.watchlistItem.deleteMany({
      where: {
        folder: { userId: user.id },
      },
    });
    await prisma.watchlistFolder.deleteMany({
      where: { userId: user.id },
    });
    await prisma.alert.deleteMany({
      where: { userId: user.id },
    });

    await prisma.watchlistFolder.create({
      data: {
        userId: user.id,
        name: "Indices",
        items: {
          create: [
            { symbol: "NIFTY", exchange: "NSE" },
            { symbol: "BANKNIFTY", exchange: "NSE" },
            { symbol: "SENSEX", exchange: "BSE" },
          ],
        },
      },
    });

    await prisma.alert.createMany({
      data: [
        {
          userId: user.id,
          symbol: "RELIANCE",
          condition: AlertCondition.ABOVE,
          targetPrice: 3000,
          isActive: true,
        },
        {
          userId: user.id,
          symbol: "SBIN",
          condition: AlertCondition.BELOW,
          targetPrice: 780,
          isActive: true,
        },
      ],
    });

    console.log(
      JSON.stringify(
        {
          seededUser: {
            email,
            password,
          },
          createdFolders: ["Indices"],
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
