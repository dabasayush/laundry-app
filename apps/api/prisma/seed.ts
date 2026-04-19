import { prisma } from "../src/config/prisma";
import { hashPassword } from "../src/utils/password";

async function main() {
  try {
    // Check if master admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "aditya@lavish.com" },
    });

    if (existingAdmin) {
      console.log("✅ Master admin already exists");
      return;
    }

    // Create master admin
    const passwordHash = await hashPassword("aditya");
    const admin = await prisma.user.create({
      data: {
        name: "Aditya Master",
        email: "aditya@lavish.com",
        phone: "+919999999999",
        passwordHash,
        role: "ADMIN",
        isActive: true,
        isVerified: true,
      },
    });

    console.log("✅ Master admin created successfully");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
