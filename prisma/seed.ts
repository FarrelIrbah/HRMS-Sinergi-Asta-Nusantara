import { PrismaClient, Role } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("Admin123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@ptsan.co.id" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@ptsan.co.id",
      hashedPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log("Seed completed: Super Admin user created (admin@ptsan.co.id)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
