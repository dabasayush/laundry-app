import { prisma } from "./src/config/prisma";
import { hashPassword } from "./src/utils/password";

async function main() {
  try {
    // Check if test driver already exists
    const existingDriver = await prisma.driver.findFirst({
      where: {
        OR: [
          { email: "driver@example.com" },
          { phone: "9999999999" },
        ],
      },
    });

    if (existingDriver) {
      console.log("✅ Test driver already exists");
      console.log(`   Email: ${existingDriver.email}`);
      console.log(`   Phone: ${existingDriver.phone}`);
      console.log(`   Name: ${existingDriver.name}`);
      return;
    }

    // Create test driver
    const passwordHash = await hashPassword("password123");
    const driver = await prisma.driver.create({
      data: {
        name: "Demo Driver",
        email: "driver@example.com",
        phone: "9999999999",
        passwordHash,
        vehicleNumber: "DRV-001",
        vehicleType: "CAR",
        isActive: true,
        isAvailable: true,
        totalDeliveries: 0,
        totalRating: 0,
      },
    });

    console.log("✅ Test driver created successfully");
    console.log(`   Email: ${driver.email}`);
    console.log(`   Phone: ${driver.phone}`);
    console.log(`   Name: ${driver.name}`);
    console.log(`   Password: password123`);
  } catch (error) {
    console.error("❌ Error:", error);
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
