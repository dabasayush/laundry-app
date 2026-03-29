import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function registerAdmin() {
  try {
    const email = "aditya@lavish.com";
    const password = "adi@lavish";

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`✓ Admin user already exists: ${email}`);
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        phone: "9999999999", // Required field, using placeholder
        passwordHash,
        role: "ADMIN",
        isVerified: true,
        isActive: true,
      },
    });

    console.log("✓ Admin user created successfully:");
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role: ${admin.role}`);
  } catch (error) {
    console.error("✗ Failed to create admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

registerAdmin();
